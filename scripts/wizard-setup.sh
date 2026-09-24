#!/usr/bin/env bash
#
# OpenReply self-host setup — part 1: accounts & API keys
# Walks you through creating the free cloud services and captures their keys
# into .env. Run from the repo root:  bash scripts/wizard-setup.sh
#
# Everything above the "STAGES" marker is the wizard library: do not hand-edit
# it. Author the per-step stages below the marker.

set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────
# Wizard library: delightful, consistent UX, identical across every wizard.
# ──────────────────────────────────────────────────────────────────────────

if [[ -t 1 ]] && command -v tput >/dev/null 2>&1 && [[ "$(tput colors 2>/dev/null || echo 0)" -ge 8 ]]; then
  BOLD=$(tput bold); DIM=$(tput dim); RESET=$(tput sgr0)
  BLUE=$(tput setaf 4); GREEN=$(tput setaf 2); YELLOW=$(tput setaf 3); RED=$(tput setaf 1)
else
  BOLD=""; DIM=""; RESET=""; BLUE=""; GREEN=""; YELLOW=""; RED=""
fi

# Author sets this at the top of the stages section.
TOTAL_STAGES=0

_STAGE_INDEX=0
ENV_FILE="${ENV_FILE:-.env}"
WRITTEN_ENV=()    # KEYs written to ENV_FILE this run
WRITTEN_SECRET=() # secret NAMEs set this run
SKIPPED=()        # things we couldn't do (e.g. gh missing)

# _clear wipes the terminal so only the current step is on screen. No-op when
# output isn't a terminal, so piped logs stay readable.
_clear() {
  [[ -t 1 ]] || return 0
  if command -v tput >/dev/null 2>&1; then tput clear; else printf '\033[2J\033[3J\033[H'; fi
}

# banner "Title" shows the opening frame: what this wizard does.
banner() {
  _clear
  printf '\n%s%s  %s%s\n' "$BOLD" "$BLUE" "$1" "$RESET"
  printf '%s  %s stages%s\n\n' "$DIM" "$TOTAL_STAGES" "$RESET"
  printf '%s  You drive the browser; this wizard tells you exactly what to do and\n' "$DIM"
  printf '  captures the values you copy back. Stop any time with Ctrl-C and re-run\n'
  printf '  later, since it remembers values already saved.%s\n' "$RESET"
  pause "Ready to start?"
}

# stage "Name" clears the screen, then announces a stage and shows progress.
# Clearing keeps only the current step on screen.
stage() {
  _clear
  _STAGE_INDEX=$((_STAGE_INDEX + 1))
  printf '\n%s%s▸ Stage %s/%s · %s%s\n' \
    "$BOLD" "$BLUE" "$_STAGE_INDEX" "$TOTAL_STAGES" "$1" "$RESET"
}

# say "..." prints a plain instruction line.
say()  { printf '  %s\n' "$1"; }
# step "..." is a numbered-feeling action the human takes in the browser.
step() { printf '  %s•%s %s\n' "$BLUE" "$RESET" "$1"; }
note() { printf '  %s%s%s\n' "$DIM" "$1" "$RESET"; }
warn() { printf '  %s⚠ %s%s\n' "$YELLOW" "$1" "$RESET"; }

# open_url URL opens it in the human's browser, cross-platform incl. WSL.
open_url() {
  local url="$1"
  printf '  %s↗ opening%s %s\n' "$GREEN" "$RESET" "$url"
  { if   command -v wslview     >/dev/null 2>&1; then wslview "$url"
    elif command -v explorer.exe >/dev/null 2>&1; then explorer.exe "$url"
    elif command -v xdg-open    >/dev/null 2>&1; then xdg-open "$url"
    elif command -v open        >/dev/null 2>&1; then open "$url"
    else warn "couldn't open a browser; visit it manually: $url"; fi
  } >/dev/null 2>&1 || warn "couldn't open a browser, so visit it manually: $url"
}

# pause "msg" waits for the human to confirm they've done the manual part.
pause() {
  printf '  %s%s%s ' "$DIM" "${1:-Press Enter to continue}" "$RESET"
  read -r _ || true
}

# confirm "question" is a y/N gate; returns success on yes.
confirm() {
  local reply=""
  printf '  %s? %s [y/N] ' "$YELLOW" "$1"
  read -r reply || true
  [[ "$reply" =~ ^[Yy] ]]
}

# _existing KEY: current value of KEY in ENV_FILE, if any.
_existing() {
  [[ -f "$ENV_FILE" ]] || return 1
  local line; line=$(grep -E "^${1}=" "$ENV_FILE" | tail -n1) || return 1
  printf '%s' "${line#*=}"
}

# ask KEY "Prompt" reads a value into $KEY. Offers the existing .env value as
# a default on re-runs (Enter keeps it). Visible input (non-secret).
ask() {
  local key="$1" prompt="$2" current input
  current=$(_existing "$key" || true)
  if [[ -n "$current" ]]; then
    printf '  %s%s%s %s[Enter keeps current]%s ' "$BOLD" "$prompt" "$RESET" "$DIM" "$RESET"
  else
    printf '  %s%s%s ' "$BOLD" "$prompt" "$RESET"
  fi
  read -r input || true
  [[ -z "$input" && -n "$current" ]] && input="$current"
  printf -v "$key" '%s' "$input"
}

# ask_secret KEY "Prompt" is like ask, but input is hidden.
ask_secret() {
  local key="$1" prompt="$2" current input
  current=$(_existing "$key" || true)
  if [[ -n "$current" ]]; then
    printf '  %s%s%s %s[Enter keeps current]%s ' "$BOLD" "$prompt" "$RESET" "$DIM" "$RESET"
  else
    printf '  %s%s%s ' "$BOLD" "$prompt" "$RESET"
  fi
  read -rs input || true
  printf '\n'
  [[ -z "$input" && -n "$current" ]] && input="$current"
  printf -v "$key" '%s' "$input"
}

# write_env KEY VALUE upserts KEY=VALUE into ENV_FILE (creates it; replaces
# any existing line). Idempotent.
write_env() {
  local key="$1" value="$2" tmp
  touch "$ENV_FILE"
  tmp=$(mktemp)
  grep -vE "^${key}=" "$ENV_FILE" > "$tmp" || true
  printf '%s=%s\n' "$key" "$value" >> "$tmp"
  mv "$tmp" "$ENV_FILE"
  WRITTEN_ENV+=("$key")
  printf '  %s✓ wrote%s %s → %s\n' "$GREEN" "$RESET" "$key" "$ENV_FILE"
}

# set_secret NAME VALUE sets a GitHub Actions repo secret via gh. Falls back
# to a warning (and records it) if gh is unavailable or unauthenticated.
set_secret() {
  local name="$1" value="$2"
  if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    if printf '%s' "$value" | gh secret set "$name" >/dev/null 2>&1; then
      WRITTEN_SECRET+=("$name")
      printf '  %s✓ set%s GitHub secret %s\n' "$GREEN" "$RESET" "$name"
      return
    fi
  fi
  SKIPPED+=("GitHub secret $name (set it manually: gh secret set $name)")
  warn "skipped GitHub secret $name: gh not ready; set it later"
}

# set_var NAME VALUE sets a GitHub Actions repo variable (non-secret).
set_var() {
  local name="$1" value="$2"
  if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    if gh variable set "$name" --body "$value" >/dev/null 2>&1; then
      printf '  %s✓ set%s GitHub variable %s\n' "$GREEN" "$RESET" "$name"
      return
    fi
  fi
  SKIPPED+=("GitHub variable $name")
  warn "skipped GitHub variable $name, gh not ready; set it later"
}

# finish clears, then shows a closing summary of everything configured.
finish() {
  _clear
  printf '\n%s%s  ✓ Setup complete%s\n' "$BOLD" "$GREEN" "$RESET"
  (( ${#WRITTEN_ENV[@]} ))    && note "wrote ${#WRITTEN_ENV[@]} value(s) to $ENV_FILE: ${WRITTEN_ENV[*]}"
  (( ${#WRITTEN_SECRET[@]} )) && note "set ${#WRITTEN_SECRET[@]} GitHub secret(s): ${WRITTEN_SECRET[*]}"
  if (( ${#SKIPPED[@]} )); then
    printf '\n'; warn "still to do by hand:"
    for s in "${SKIPPED[@]}"; do note "  - $s"; done
  fi
  printf '\n'
}

# ──────────────────────────────────────────────────────────────────────────
# STAGES: author this section. One stage() per step the human takes.
# Set TOTAL_STAGES to match the stages you write.
# ──────────────────────────────────────────────────────────────────────────

TOTAL_STAGES=4

banner "OpenReply 安裝 Part 1 — 帳號與 API keys"

# ── Stage 1: Neon (Postgres) ───────────────────────────────────────────────
stage "Neon Postgres（免費資料庫）"
say "建立 Neon 帳號並取得 DATABASE_URL（prisma migrate 與資料儲存都要用）。"
open_url "https://neon.tech"
step "Sign up（用 GitHub/Google，或你的 djdindin.taiwan@gmail.com）"
step "進 Dashboard → 點 New Project → 名稱填 openreply"
step "Region 選 Tokyo（或離台灣最近的）→ 按 Create Project"
step "在專案頁按 Connect → 選 Connection string → 複製整段（postgresql://...）"
note "Neon 免費層 0.5GB，夠單帳號跑；不用填信用卡。"
ask DATABASE_URL "貼上 Neon connection string:"
if [[ "$DATABASE_URL" != *sslmode* ]]; then
  DATABASE_URL="${DATABASE_URL}?sslmode=require"
  note "已自動加上 ?sslmode=require（Neon 要求 TLS）"
fi
write_env DATABASE_URL "$DATABASE_URL"
pause

# ── Stage 2: Redis Cloud (Redis) ───────────────────────────────────────────
stage "Redis Cloud（免費佇列）"
say "建立免費 Redis DB，供 BullMQ 發送佇列與限速器使用（需要真 Redis，Upstash 那類 HTTP-only 不行）。"
open_url "https://app.redislabs.com"
step "註冊（可用 Google）→ 進 Subscription 頁"
step "選 Free 方案（30MB）→ 建一個 Fixed subscription（名稱隨意）"
step "在 subscription 裡 + New Database → 名稱填 openreply → Activate"
step "打開 database 頁 → 複製 Public endpoint（格式 host:port）"
step "同一頁按 Show 展開 password → 複製密碼"
ask REDIS_HOST "貼上 Public endpoint（host:port）:"
ask_secret REDIS_PASSWORD "貼上 Redis 密碼:"
write_env REDIS_URL "rediss://default:${REDIS_PASSWORD}@${REDIS_HOST}"
pause

# ── Stage 3: Resend（登入 email）──────────────────────────────────────────
stage "Resend（email magic link 登入）"
say "OpenReply 登入只靠 email 魔法連結，沒有 Resend 就沒人登得進去。用你的 Gmail 註冊。"
open_url "https://resend.com"
step "Sign up → 用 djdindin.taiwan@gmail.com 註冊並驗證 email"
step "進 Dashboard → 左側 API Keys → Create API Key → 複製（re_... 開頭）"
step "把 key 貼回下面（輸入會隱藏）"
ask_secret RESEND_API_KEY "貼上 Resend API key:"
note "寄件人固定用 onboarding@resend.dev —— Resend 免費層只允許寄到註冊 email，也就是你的 Gmail，測試登入沒問題。"
write_env RESEND_API_KEY "$RESEND_API_KEY"
write_env EMAIL_FROM "onboarding@resend.dev"
pause

# ── Stage 4: Meta app（Instagram API 三把鑰匙）────────────────────────────
stage "Meta app — 建 IG 自動回覆的應用"
say "這是全流程最花時間的一步。需要一個 Facebook 帳號（無法只用 IG）。"
say "重點：use case 一定要選「Manage messaging and content on Instagram」，"
say "不要選 Marketing API（會卡審核）也不要選 Facebook Login（OAuth 會失敗）。"
open_url "https://developers.facebook.com/apps"
step "登入 FB → 按 Create app → App type 選 Business"
step "use case 選 Manage messaging and content on Instagram → Next"
step "填 app 名稱（例如 OpenReply）與聯絡 email → Create app"
step "左側 Instagram → API setup with Instagram login：複製 App ID（數字，2036... 開頭）"
step "同一頁按 Show 展開 App secret → 複製"
step "左側 App settings → Basic → App secret 旁的 Show → 複製（這支跟上面不同支！）"
note "三支都是 secret，貼上時輸入會隱藏。"
ask_secret INSTAGRAM_APP_ID "貼上 Instagram App ID:"
ask_secret INSTAGRAM_APP_SECRET "貼上 Instagram App secret:"
ask_secret FACEBOOK_APP_SECRET "貼上 Facebook App secret（Basic 頁那支）:"
write_env INSTAGRAM_APP_ID "$INSTAGRAM_APP_ID"
write_env INSTAGRAM_APP_SECRET "$INSTAGRAM_APP_SECRET"
write_env FACEBOOK_APP_SECRET "$FACEBOOK_APP_SECRET"
pause

finish
say ""
say "Part 1 完成！.env 已收集完所有帳號 key。"
say "接下來告訴 Hermes，它會：migrate 資料庫 → 啟動 web + worker → 開 tunnel。"
say "之後 Part 2 wizard 會帶你設定 Meta 的 OAuth redirect、webhook 與發佈。"
