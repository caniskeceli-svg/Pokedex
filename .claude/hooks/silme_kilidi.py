#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""silme_kilidi.py - PreToolUse hook (Bash) - fiziksel silmeyi engeller, karantinaya yonlendirir.

Claude Code PreToolUse hook sozlesmesi:
  - stdin'den JSON okur: {"tool_name": "...", "tool_input": {"command": "..."}, ...}
  - tool_name != "Bash" ise dokunmadan izin verir (exit 0).
  - Komutu ayristirip tehlikeli silme/geri-donusu-olmayan git islemlerini tarar.
  - Engellenirse: exit code 2, aciklama stderr'e yazilir (Claude Code bunu
    modele "blocked" nedeni olarak gosterir).
  - Izin verilirse: exit code 0.
  - BELIRSIZ/ayristirilamayan her durumda FAIL-CLOSED: engelle.

Kurallar (oncelik sirasiyla):
  1. Gizli dosya kaliplari (.env*, *.key, *.pem, secrets*) -> HER ZAMAN engelli,
     git-takipli ya da "junk" kalibi olsa bile.
  2. Repo DISINDA bir hedef -> engelli (karantina/tasima onerilir).
  3. "Junk" kaliplari (__pycache__, .pytest_cache, node_modules, dist, build,
     .cache, *.pyc) repo icinde ise -> serbest (takipsiz olsalar bile).
  4. git'in TAKIP ETTIGI dosya/dizin (repo icinde) -> serbest (geri gelir).
  5. Diger her silme (takipsiz, junk degil) -> engelli, karantina onerilir.
  6. git push --force / --force-with-lease, git clean, git reset --hard,
     git branch -D, uzak branch silme -> HER ZAMAN engelli (git-takipli olsa
     bile - bunlar tekil dosya silme degil, repo GECMISINI/durumunu bozan
     islemler).
  7. find -delete / find ... -exec rm ..., rsync --delete -> HER ZAMAN
     engelli (hedefleri dinamik/ongorulemez, guvenli degerlendirilemez).
"""
import json
import os
import re
import shlex
import sys

KARANTINA_IPUCU = (
    "Silme engellendi. Bunun yerine karantinaya tasi: "
    "mkdir -p .karantina && mv -- <hedef> .karantina/ "
    "(veri kaybolmaz, Can kendisi kalici silebilir)."
)

GIZLI_DOSYA_DESENLERI = [
    re.compile(r"(^|/)\.env([.\-_].*)?$", re.IGNORECASE),
    re.compile(r"\.key$", re.IGNORECASE),
    re.compile(r"\.pem$", re.IGNORECASE),
    re.compile(r"(^|/)secrets?([.\-_].*)?$", re.IGNORECASE),
]

JUNK_DESENLERI = [
    re.compile(r"(^|/)__pycache__(/.*)?$"),
    re.compile(r"(^|/)\.pytest_cache(/.*)?$"),
    re.compile(r"(^|/)node_modules(/.*)?$"),
    re.compile(r"(^|/)dist(/.*)?$"),
    re.compile(r"(^|/)build(/.*)?$"),
    re.compile(r"(^|/)\.cache(/.*)?$"),
    re.compile(r"\.pyc$"),
]

DELETE_KOMUTLARI = {"rm", "rmdir", "unlink", "shred"}
SHELL_SARMALAYICILAR = {"bash", "sh", "zsh", "dash", "ksh"}

# Bu "sarmalayicilar" (prog once gelip asil komutu baslatan seyler) acilip
# icindeki asil komut da taranir - yoksa "sudo rm -rf x" ya da
# "env FOO=1 rm -rf x" gibi cagrilar hic degerlendirilmeden geciyordu
# (denetci tarafindan bulundu). Deger: o bayraktan sonraki token de
# sarmalayicinin parcasidir (atlanir), orn. "sudo -u kullanici rm x".
SARMALAYICI_DEGER_ALAN_BAYRAK = {
    "sudo": {"-u", "-g", "-h", "-p", "-C", "-r", "-t"},
    "doas": {"-u"},
    "nice": {"-n"},
    "ionice": {"-c", "-n", "-p"},
    "nohup": set(),
    "time": set(),
    "command": set(),
    "exec": set(),
    "setsid": set(),
    "stdbuf": {"-i", "-o", "-e"},
    "chroot": set(),
}


def _backtick_to_dollar(s):
    """`cmd` -> $(cmd) (basit, ic ice olmayan durum icin) - tarama kolaylasin diye."""
    return re.sub(r"`([^`]*)`", r"$(\1)", s)


def tokenize_gruplar(komut_metni):
    """Komut dizesini, tirnak icini koruyarak ; && || | ( ) & gibi operatorlerden
    bolup "basit komut" token listeleri dondurur. $(...) ve `...` icindeki
    komutlar da operator/parantez sayesinde kendiliginden ayri gruplara duser."""
    komut_metni = _backtick_to_dollar(komut_metni)
    try:
        lexer = shlex.shlex(komut_metni, posix=True, punctuation_chars=True)
        lexer.whitespace_split = True
        tokenlar = list(lexer)
    except ValueError:
        # Tirnak kapanmamis vb. - ayristirilamiyor, fail-closed ust seviyede ele alinir.
        raise

    gruplar = []
    mevcut = []
    for tok in tokenlar:
        # Sadece operator karakterlerinden olusan token (&&, ||, ;, |, &, (, ), $) -> ayirici
        if tok and all(c in "&|;()$" for c in tok):
            if mevcut:
                gruplar.append(mevcut)
                mevcut = []
        else:
            mevcut.append(tok)
    if mevcut:
        gruplar.append(mevcut)
    return gruplar


def _shell_ic_komutu_ac(g, derinlik):
    """g bir 'bash -c "..."' ise, ic komutu rekursif tarar; degilse []."""
    if not g:
        return []
    prog = os.path.basename(g[0])
    if prog in SHELL_SARMALAYICILAR and "-c" in g:
        idx = g.index("-c")
        if idx + 1 < len(g):
            return tum_basit_komutlar(g[idx + 1], derinlik + 1)
    return []


def _genel_sarmalayici_ac(g):
    """g bir sudo/env/nice/nohup/... ile basliyorsa, sarmalayicinin kendi
    bayraklarini/degiskenlerini atlayip ASIL komutun token listesini dondurur.
    Sarmalayici degilse None."""
    if not g:
        return None
    prog = os.path.basename(g[0])

    if prog == "env":
        i = 1
        while i < len(g) and (g[i].startswith("-") or "=" in g[i]):
            i += 1
        return g[i:] if i < len(g) else None

    if prog == "timeout":
        i = 1
        while i < len(g) and g[i].startswith("-"):
            i += 1
        if i < len(g):
            i += 1  # SURE argumanini atla
        return g[i:] if i < len(g) else None

    if prog in SARMALAYICI_DEGER_ALAN_BAYRAK:
        deger_alanlar = SARMALAYICI_DEGER_ALAN_BAYRAK[prog]
        i = 1
        while i < len(g) and g[i].startswith("-"):
            bayrak = g[i]
            i += 1
            if bayrak in deger_alanlar and i < len(g):
                i += 1
        return g[i:] if i < len(g) else None

    return None


def tum_basit_komutlar(komut_metni, derinlik=0):
    """tokenize_gruplar + bash -c/sh -c VE sudo/env/nice/... gibi
    sarmalayicilarin icindeki asil komutlari da acip tek liste olarak
    dondurur (ic ice sarmalamalar dahil, derinlik siniriyla)."""
    if derinlik > 6:
        raise ValueError("komut ic ice gecme sinirini asti")
    gruplar = tokenize_gruplar(komut_metni)
    sonuc = []
    for g in gruplar:
        sonuc.append(g)
        sonuc.extend(_shell_ic_komutu_ac(g, derinlik))

        ic = g
        tur = 0
        while tur < 6:
            yeni_ic = _genel_sarmalayici_ac(ic)
            if yeni_ic is None:
                break
            sonuc.append(yeni_ic)
            sonuc.extend(_shell_ic_komutu_ac(yeni_ic, derinlik))
            ic = yeni_ic
            tur += 1
    return sonuc


def _yol_desen_eslesiyor_mu(desenler, yol):
    yol_norm = yol.replace(os.sep, "/")
    taban = os.path.basename(yol_norm)
    for d in desenler:
        if d.search(yol_norm) or d.search(taban):
            return True
    return False


def _git_takipli_mi(proje_kok, repo_ici_yol):
    import subprocess
    try:
        r = subprocess.run(
            ["git", "-C", proje_kok, "ls-files", "--error-unmatch", "-z", "--", repo_ici_yol],
            capture_output=True, timeout=10)
        if r.returncode == 0:
            return True
    except Exception:
        pass
    try:
        r = subprocess.run(
            ["git", "-C", proje_kok, "ls-files", "-z", "--", repo_ici_yol],
            capture_output=True, timeout=10)
        return r.returncode == 0 and bool(r.stdout.strip())
    except Exception:
        return False


def _yol_icin_karar_tek(proje_kok, mutlak, ham_yol):
    """mutlak (zaten cozulmus, normpath'li) bir yol icin tek basina karar.
    Doner: (izinli: bool, sebep: str)."""
    proje_kok_norm = os.path.normpath(proje_kok)

    if _yol_desen_eslesiyor_mu(GIZLI_DOSYA_DESENLERI, ham_yol) or \
       _yol_desen_eslesiyor_mu(GIZLI_DOSYA_DESENLERI, mutlak):
        return False, "gizli/sir dosyasi kalibi ('%s') - asla silinmez" % ham_yol

    icinde_mi = (mutlak == proje_kok_norm or
                 mutlak.startswith(proje_kok_norm + os.sep))
    if not icinde_mi:
        return False, "repo disinda bir hedef ('%s' -> '%s')" % (ham_yol, mutlak)

    repo_ici_yol = os.path.relpath(mutlak, proje_kok_norm)

    if _yol_desen_eslesiyor_mu(JUNK_DESENLERI, repo_ici_yol):
        return True, "junk/derleme ciktisi kalibi ('%s')" % repo_ici_yol

    if _git_takipli_mi(proje_kok, repo_ici_yol):
        return True, "git-takipli, geri gelir ('%s')" % repo_ici_yol

    return False, "takipsiz dosya, junk kalibiyla eslesmiyor ('%s')" % repo_ici_yol


def _hedef_karar(proje_kok, ham_yol, komut_adi=""):
    """Tek bir silme hedefi (rm/rmdir/unlink/shred argumani) icin karar.
    Doner: (izinli: bool, sebep: str)

    shred, hedef bir SEMBOLIK LINK ise linkin kendisini degil linkin
    GOSTERDIGI dosyanin icerigini yok eder - bu yuzden shred icin hem
    linkin kendi yolu hem de cozulmus gercek hedefi (realpath) ayri ayri
    degerlendirilir (ikisi de izinli olmali)."""
    if ham_yol.startswith("-"):
        return True, "bayrak (hedef degil)"

    if os.path.isabs(ham_yol):
        mutlak = os.path.normpath(ham_yol)
    else:
        mutlak = os.path.normpath(os.path.join(proje_kok, ham_yol))

    izinli, sebep = _yol_icin_karar_tek(proje_kok, mutlak, ham_yol)
    if not izinli:
        return izinli, sebep

    if komut_adi == "shred" and os.path.islink(mutlak):
        gercek = os.path.realpath(mutlak)
        if gercek != mutlak:
            g_izinli, g_sebep = _yol_icin_karar_tek(proje_kok, gercek, gercek)
            if not g_izinli:
                return False, "sembolik link '%s' -> gercek hedef: %s" % (ham_yol, g_sebep)

    return izinli, sebep


def _rm_benzeri_degerlendir(proje_kok, g):
    komut_adi = os.path.basename(g[0])
    hedefler = [t for t in g[1:] if t != "--"]
    if not hedefler:
        return True, "hedefsiz cagri"
    sonuclar = [_hedef_karar(proje_kok, h, komut_adi) for h in hedefler if not h.startswith("-")]
    if not sonuclar:
        return True, "sadece bayrak, gercek hedef yok"
    for izinli, sebep in sonuclar:
        if not izinli:
            return False, sebep
    return True, "; ".join(s for _, s in sonuclar)


def _git_degerlendir(g):
    if len(g) < 2:
        return True, "alt komut yok"
    alt = g[1]
    kalan = g[2:]

    if alt == "push":
        if "--force" in kalan or "-f" in kalan or "--force-with-lease" in kalan:
            return False, "git push --force/-f/--force-with-lease yasak"
        if "--delete" in kalan:
            return False, "uzak branch silme (git push --delete) yasak"
        for arg in kalan:
            if arg.startswith(":") and len(arg) > 1:
                return False, "uzak branch silme (refspec ':branch') yasak"
        return True, "normal push"

    if alt == "clean":
        if "-n" in kalan or "--dry-run" in kalan:
            return True, "git clean kuru calistirma (-n/--dry-run), guvenli"
        return False, "git clean takipsiz dosyalari fiziksel siler - yasak"

    if alt == "reset":
        if "--hard" in kalan:
            return False, "git reset --hard yasak (pushlanmis commit'leri yok edebilir)"
        return True, "git reset (--hard degil)"

    if alt == "branch":
        if "-D" in kalan:
            return False, "git branch -D (zorla silme) yasak"
        if "--delete" in kalan and ("--force" in kalan or "-f" in kalan):
            return False, "git branch --delete --force/-f (zorla silme) yasak"
        return True, "git branch (zorla silme degil)"

    if alt == "submodule" and kalan[:1] == ["deinit"]:
        return False, "git submodule deinit - calisma kopyasini geri donusu guc sekilde siler"

    if alt == "worktree" and kalan[:1] == ["remove"]:
        return False, "git worktree remove - commit edilmemis degisiklikleri silebilir"

    return True, "diger git komutu"


def _find_degerlendir(g):
    if "-delete" in g:
        return False, "find -delete - dinamik/ongorulemez hedefler, guvenli degerlendirilemez"
    if "-exec" in g:
        idx = g.index("-exec")
        if idx + 1 < len(g) and os.path.basename(g[idx + 1]) in ("rm", "unlink", "shred"):
            return False, "find -exec rm/unlink/shred - dinamik hedefler, guvenli degerlendirilemez"
    return True, "find (silme eylemi yok)"


def _rsync_degerlendir(g):
    if "--delete" in g or any(a.startswith("--delete") for a in g):
        return False, "rsync --delete hedefte fazlalik dosyalari siler - guvenli degerlendirilemez"
    return True, "rsync (--delete yok)"


def _xargs_degerlendir(g):
    """xargs <komut> - <komut>'un gercek hedefleri STDIN'den (ornegin bir
    find/ls ciktisindan) dinamik olarak gelir, statik olarak guvenli
    degerlendirilemez. Silme/git komutuna besleniyorsa engelle (find -delete
    ile ayni risk kategorisi)."""
    i = 1
    while i < len(g) and g[i].startswith("-"):
        i += 1
    if i < len(g):
        ic_prog = os.path.basename(g[i])
        if ic_prog in DELETE_KOMUTLARI or ic_prog == "git":
            return False, ("xargs ile '%s' - hedefler stdin'den dinamik geliyor, "
                           "guvenli degerlendirilemez" % ic_prog)
    return True, "xargs (silme/git komutuna beslenmiyor)"


def degerlendir(proje_kok, komut_metni):
    """(izinli: bool, sebep: str) dondurur. Belirsiz/hata -> (False, ...)."""
    try:
        basit_komutlar = tum_basit_komutlar(komut_metni)
    except Exception as e:
        return False, "komut ayristirilamadi (fail-closed): %s" % e

    for g in basit_komutlar:
        if not g:
            continue
        prog = os.path.basename(g[0])
        try:
            if prog in DELETE_KOMUTLARI:
                izinli, sebep = _rm_benzeri_degerlendir(proje_kok, g)
            elif prog == "git":
                izinli, sebep = _git_degerlendir(g)
            elif prog == "find":
                izinli, sebep = _find_degerlendir(g)
            elif prog == "rsync":
                izinli, sebep = _rsync_degerlendir(g)
            elif prog == "xargs":
                izinli, sebep = _xargs_degerlendir(g)
            else:
                continue
        except Exception as e:
            return False, "degerlendirme hatasi (fail-closed) '%s': %s" % (" ".join(g), e)
        if not izinli:
            return False, "'%s' -> %s" % (" ".join(g), sebep)
    return True, "tehlikeli silme/git deseni bulunamadi"


def main():
    try:
        veri = json.load(sys.stdin)
    except Exception as e:
        print("silme_kilidi: stdin JSON okunamadi (fail-closed): %s" % e, file=sys.stderr)
        sys.exit(2)

    if veri.get("tool_name") != "Bash":
        sys.exit(0)

    komut = (veri.get("tool_input") or {}).get("command", "")
    if not isinstance(komut, str) or not komut.strip():
        sys.exit(0)

    proje_kok = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    izinli, sebep = degerlendir(proje_kok, komut)

    if not izinli:
        print("silme_kilidi: ENGELLENDI - %s\n%s" % (sebep, KARANTINA_IPUCU), file=sys.stderr)
        sys.exit(2)

    sys.exit(0)


if __name__ == "__main__":
    main()
