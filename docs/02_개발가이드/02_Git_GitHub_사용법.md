# Git & GitHub 사용법

## 최초 1회 설정

```bash
git config --global user.name "황성근"
git config --global user.email "GitHub가입메일"
```

## 저장소 초기화

```bash
git init
```

## 파일 추가

```bash
git add .
```

## 커밋

```bash
git commit -m "first commit"
```

## 원격 저장소 연결

```bash
git remote add origin https://github.com/idsk77-art/ruahnote.git
```

## 브랜치 설정

```bash
git branch -M main
```

## 최초 Push

```bash
git push -u origin main
```

## 이후 Push

```bash
git push
```

## 상태 확인

```bash
git status
```

## 커밋 로그 확인

```bash
git log --oneline
```
