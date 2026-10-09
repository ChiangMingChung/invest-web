# 上傳 GitHub 與取得獨立網址

本套程式是完整的靜態網站，不需要後端或資料庫。

## 最容易的操作方式

1. 準備好本專案資料夾。
2. 登入 GitHub，建立新的儲存庫，例如 `investment-return-compare`。
3. 若使用 GitHub Free 的一般公開 Pages 方案，建立 Public 儲存庫。公開表示別人可以看到原始碼。
4. 上傳專案資料夾「裡面的檔案與子資料夾」，而不是 ZIP 或外層包裝資料夾。完成提交。
5. 儲存庫根目錄應直接看得到 `index.html`、`favicon.svg`、`catalogue.json` 和 `README.md`。
6. 到儲存庫 **Settings → Pages**。
7. 在 **Build and deployment → Source** 選 **Deploy from a branch**。
8. Branch 選 `main`（或你實際使用的預設分支），Folder 選 `/(root)`，按 **Save**。
9. 發布成功後，Pages 頁面會顯示網站的實際網址。

專案網站網址通常為：

```text
https://你的帳號.github.io/你的儲存庫名稱/
```

這只是格式範例，不是已替你建立的網址。以 GitHub 顯示的發布成功網址為準。

## 使用 git 上傳（已有空白儲存庫時）

在專案資料夾開啟終端機：

```sh
git init
git add .
git commit -m "Initial investment calculator"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

將 YOUR_USERNAME 和 YOUR_REPOSITORY 換成自己的帳號與儲存庫；使用 GitHub 正常提供的登入方式，不要把 token 放進程式碼。

## 哪些東西不用準備？

- 不需要自己的網域。
- 不需要 npm install 或 build。
- 不需要 API key、資料庫、伺服器或客戶登入。

## 更新網站

修改檔案後提交到發布分支，GitHub Pages 會重新發布。

## 隱私與公開性

使用公開儲存庫時，程式碼與文件可供他人查看。網站訪客輸入金額在瀏覽器計算，不會由本程式上傳；網站託管服務仍可能產生一般存取紀錄。

## 官方參考

- [GitHub Pages 發布來源設定](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [建立 GitHub Pages 網站](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [將檔案加入儲存庫](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)
