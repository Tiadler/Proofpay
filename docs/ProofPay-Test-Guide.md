# ProofPay Rialo Test Guide

## 1. ProofPay la gi?

ProofPay la mot DApp prototype cho thanh toan escrow theo bang chung.

Y tuong cot loi:

```text
Lock funds first -> verify proof later -> release or refund
```

Vi du de hieu nhat:

```text
Client tra 100 RIALO cho developer neu GitHub PR #42 duoc merge truoc deadline.
```

ProofPay khong chi la app gui token. No la payment workflow:

```text
Nguoi tra tien
  -> khoa RIALO vao escrow
  -> dat dieu kien thanh toan
  -> verifier kiem tra bang chung GitHub
  -> release cho nguoi lam hoac refund lai payer
```

Ban hien tai la prototype:

- Wallet, RIALO balance, faucet, escrow transfer la simulated trong browser session.
- GitHub public PR verification goi GitHub API that.
- Rialo adapter van la mock adapter, chua phai transaction Rialo devnet/mainnet that.
- GitHub App/OAuth production path da co backend skeleton, nhung can env config de ket noi GitHub that.
- Logo va favicon dung `public/static/logo/logo.png`.
- UI co 2 theme sang/toi, chuyen bang icon mat troi/mat trang tren topbar.
- Sidebar desktop co the thu gon/mo rong; mobile dung nut logo/Menu de mo sidebar.

## 2. Chay app

Trong terminal:

```powershell
cd D:\rialo-product\proofpay-rialo\proofpay-rialo
npm.cmd run dev
```

Mo browser:

```text
http://localhost:3000/#/dashboard
```

Neu dung PowerShell tren Windows, dung `npm.cmd`, khong dung `npm`, vi may co the chan `npm.ps1`.

## 2.1 Kiem tra build va automated tests

Chay truoc khi demo hoac truoc khi ban giao:

```powershell
npm.cmd run build
npm.cmd test
```

Ket qua mong doi:

- `npm.cmd run build` in ra `Build check passed.`
- `npm.cmd test` pass tat ca test Node built-in.
- Hien tai co test cho GitHub PR verifier va mock Rialo adapter.

Neu chay bang PowerShell va gap loi `npm.ps1 cannot be loaded`, dung `npm.cmd` nhu tren.

## 3. Cac trang trong app

### 3.0 UI shell chung

Kiem tra tren moi page:

- Goc trai sidebar co logo ProofPay tu `public/static/logo/logo.png`.
- Browser tab co favicon tu cung file logo.
- Sidebar desktop co nut mui ten de thu gon/mo rong.
- Khi sidebar thu gon, chi con logo, so thu tu nav va network dot; noi dung chinh tu dong can lai.
- Tren mobile/tablet hep, topbar hien nut logo/Menu de mo sidebar overlay.
- Topbar khong con nut `Refresh`.
- Topbar co nut theme dang icon outline-only.
- Dang dark theme thi hien icon mat troi de chuyen sang light theme.
- Dang light theme thi hien icon mat trang de chuyen sang dark theme.
- Theme duoc luu trong browser localStorage, reload page van giu theme da chon.

### 3.1 Dashboard

URL:

```text
http://localhost:3000/#/dashboard
```

Trang nay dung de xem tong quan san pham.

Ban se thay:

- Hero ProofPay voi `PROOF PAY` tren 1 hang va `AUTOMATES TRUST` tren 1 hang.
- Tong quan so deal, proofs, events.
- Tong RIALO dang locked trong session ledger.
- Cac module san pham: Conditional Escrow, Guarded Vault, Programmable Payments, Automation Rules.
- Console mock Rialo adapter.

Muc dich:

- Giai thich ProofPay la mot programmable payment workflow.
- Cho thay app dang o mode devnet/mock.
- Console mock adapter khong hien default RPC URL.
- Tao diem vao nhanh cho flow `Create GitHub Escrow`.

### 3.2 Escrows

URL:

```text
http://localhost:3000/#/escrows
```

Trang nay la noi quan ly cac escrow deal.

Ban se thay:

- Bang danh sach deal.
- Status moi deal: `DRAFT`, `FUNDED`, `VERIFIED`, `RELEASED`, `REFUNDED`, `DISPUTED`.
- Amount va token.
- Dieu kien GitHub PR.
- Deadline.
- Cac action: `View`, `Fund`, `Verify`, `Release`.
- Deal Details/Audit trail.

Muc dich:

- Xem deal nao da tao.
- Chon deal de thao tac.
- Xem deal da duoc auto-fund khi deploy.
- Verify GitHub proof.
- Release hoac refund.

Luu y:

- `Deploy Escrow Workflow` chi thanh cong neu wallet connected trung voi payer address.
- `Deploy Escrow Workflow` se auto-fund va tru RIALO balance cua payer ngay.
- `Fund` chi can dung cho deal cu con o status `DRAFT`.
- `Release` se cong RIALO cho payee address.
- `Refund` se hoan RIALO ve payer address.

### 3.3 Create Deal

URL:

```text
http://localhost:3000/#/create
```

Trang nay dung de tao escrow moi.

Fields quan trong:

- `Title`: ten deal.
- `Amount`: so RIALO can tra.
- `Token`: mac dinh nen la `RIALO`.
- `Payer Address`: tu dien theo wallet connected.
- `Payee Address`: dia chi nguoi nhan tien.
- `GitHub Owner`: owner/org cua repo.
- `GitHub Repo`: ten repo.
- `Pull Request`: so PR.
- `Expected Author`: GitHub username cua nguoi lam, optional.
- `Deadline`: han verify.

Muc dich:

- Tao dieu kien thanh toan.
- Luu condition payload.
- Tao mock Rialo escrow account.
- Auto-fund escrow neu amount khong vuot qua RIALO balance cua wallet.

Vi du:

```text
Title: Fix checkout bug
Amount: 100
Token: RIALO
Payer Address: wallet cua client
Payee Address: wallet cua developer
GitHub Owner: vercel
GitHub Repo: next.js
Pull Request: 1
Deadline: 7 ngay toi
```

Sau khi deploy xong, app tu fund deal, tru balance payer, va chuyen sang page `Escrows`.

### 3.4 Proofs

URL:

```text
http://localhost:3000/#/proofs
```

Trang nay dung de xem proof pipeline cua deal dang chon.

Pipeline gom:

```text
Escrow Created
Funds Locked
Proof Verified
Payment Action
```

Muc dich:

- Cho thay deal dang o buoc nao.
- Cho thay proof tx/proof hash neu co.
- Cho thay release/refund da xay ra chua.
- Xem audit trail cua deal.

Trang nay huu ich khi demo cho nguoi xem:

```text
Day la bang chung thanh toan.
Day la transaction mock.
Day la proof hash.
Day la ket qua verifier.
```

### 3.5 Adapter

URL:

```text
http://localhost:3000/#/adapter
```

Trang nay dung de xem trang thai wallet/RIALO va Rialo adapter.

Ban se thay:

- Wallet session.
- RIALO balance.
- Faucet claim count.
- GitHub App Verification production path.
- Adapter status.
- Execution mode/mock adapter mode.
- Payment token.
- Wallet source.

Muc dich:

- Xac nhan app dang dung mock Rialo adapter.
- Xac nhan mock adapter khong hien `RPC: https://api.devnet.rialo.xyz`.
- Xac nhan wallet/RIALO flow dang chay trong browser session.
- Giai thich duong nang cap production voi GitHub App.

### 3.6 Profile / Settings

URL:

```text
http://localhost:3000/#/profile
```

Trang nay dung de quan ly profile tao tu wallet.

Ban se thay:

- Profile name.
- Wallet address.
- RIALO balance.
- GitHub connection state.
- GitHub permissions.
- GitHub App/OAuth status.
- Private repo example flows.
- Wallet/GitHub audit log trong session.

Muc dich:

- Cho thay user profile duoc tao tu wallet.
- Cho thay GitHub identity ket noi vao profile.
- Giai thich cach private repo verification hoat dong.
- Xem audit log cua faucet/fund/release/refund/GitHub connect.

## 4. Flow test tu dau toi cuoi

### Flow UI: Logo, sidebar, theme

1. Mo:

```text
http://localhost:3000/#/dashboard
```

Ket qua mong doi:

- Sidebar hien logo ProofPay o goc trai tren cung.
- Browser tab hien favicon ProofPay.
- Hero hien `PROOF PAY` 1 hang va `AUTOMATES TRUST` 1 hang.
- Khong thay nut `Refresh` tren topbar.

2. Bam nut icon theme tren topbar.

Ket qua mong doi:

- Neu dang dark theme, icon mat troi chuyen UI sang light theme.
- Neu dang light theme, icon mat trang chuyen UI sang dark theme.
- Icon chi co vien/stroke, khong co fill mau rieng.
- Reload page van giu theme vua chon.

3. Tren desktop, bam nut mui ten trong sidebar.

Ket qua mong doi:

- Sidebar thu gon lai.
- Noi dung chinh mo rong theo.
- Bam lai thi sidebar mo rong.

4. Thu voi viewport hep/mobile.

Ket qua mong doi:

- Sidebar an mac dinh.
- Topbar hien nut logo/Menu.
- Bam logo/Menu thi sidebar overlay mo ra.
- Bam link nav hoac shade ben ngoai thi sidebar dong lai.

### Flow A: Tao profile, nhan faucet, tao escrow

1. Mo:

```text
http://localhost:3000/#/dashboard
```

2. Bam `Connect Wallet`.

3. Chon `MetaMask` hoac `Phantom`.

Ket qua mong doi:

- Button `Connect Wallet` bien mat.
- Avatar profile xuat hien.
- Wallet profile duoc tao trong session.
- `Faucet +100 RIALO` hien ra.

4. Bam `Faucet +100 RIALO`.

Ket qua mong doi:

- Nut faucet xu ly khoang 1-2 giay.
- Balance tang them `100 RIALO`.
- Audit log ghi event `wallet.faucet`.

5. Vao:

```text
http://localhost:3000/#/profile
```

Ket qua mong doi:

- Thay profile details.
- Thay wallet address.
- Thay RIALO balance.
- Thay audit log faucet.

6. Vao:

```text
http://localhost:3000/#/create
```

Ket qua mong doi:

- `Payer Address` tu dien bang wallet address.
- `Token` mac dinh la `RIALO`.

7. Bam `Deploy Escrow Workflow` voi amount nho hon hoac bang balance hien co.

Ket qua mong doi:

- Neu amount lon hon balance, app bao loi insufficient balance va khong tao deal.
- Neu amount hop le, deal duoc tao va auto-funded.
- RIALO balance cua payer giam di dung amount.
- App tu chuyen sang page `Escrows`.

### Flow B: Refund escrow da funded

1. Vao:

```text
http://localhost:3000/#/escrows
```

2. Chon deal vua tao.

3. Xac nhan deal dang status `FUNDED`.

Ket qua mong doi:

- Detail co funding tx mock.
- Audit log co `wallet.fund`.

4. Bam `Refund`.

Neu khong co nut refund trong table, vao:

```text
http://localhost:3000/#/proofs
```

Sau do bam `Refund` trong selected actions.

Ket qua mong doi:

- Deal status chuyen `REFUNDED`.
- RIALO balance cua payer duoc hoan lai.
- Audit log co `wallet.refund`.

Flow nay dung de test truong hop:

```text
Client khoa tien nhung proof khong dat -> refund lai client.
```

### Flow C: Deploy escrow, verify GitHub, release

Flow nay can GitHub PR hop le.

1. Deploy deal voi repo public va PR da merge.

Vi du co the thu voi public repo, nhung can chon PR co that va da merged.

2. Deal se duoc auto-funded neu wallet du RIALO.

3. Bam `Verify`.

Ket qua co the:

- Neu PR merged dung dieu kien: status -> `VERIFIED`.
- Neu PR sai/missing/not merged: proof bi rejected.

4. Neu status la `VERIFIED`, bam `Release`.

Ket qua mong doi:

- Deal status -> `RELEASED`.
- RIALO duoc cong vao payee address trong session ledger.
- Audit log co `wallet.release`.

Luu y:

- Neu payee address khac wallet dang connected, ban se khong thay balance payee tren topbar.
- Balance payee da duoc ghi vao session ledger theo address.

### Flow D: Connect GitHub trong profile

1. Vao:

```text
http://localhost:3000/#/profile
```

2. Bam `Connect GitHub`.

Ket qua mong doi neu chua cau hinh OAuth:

- GitHub connected simulated.
- Profile hien GitHub username mock.
- Permissions hien `pull_requests:read`, `checks:read`.
- Audit log co `github.connect`.

Ket qua mong doi neu da cau hinh OAuth env:

- Page hien link `GitHub OAuth`.
- Bam link de di qua GitHub OAuth.
- Callback luu GitHub identity vao session profile.

Env can co:

```env
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_APP_SLUG=
PUBLIC_BASE_URL=http://localhost:3000
```

## 5. Private repo verification hoat dong the nao?

### Bai toan

Client va developer lam viec tren private repo.

Client khong muon public source code.

Developer muon duoc tra tien neu PR duoc merge.

ProofPay can verify PR ma khong lam lo code cho ben thu ba.

### Cach lam dung production

Dung GitHub App voi scoped permissions.

GitHub App chi can quyen hep:

```text
Repository metadata: read
Pull requests: read
Checks: read
Commit statuses: read
```

Verifier doc du lieu private qua GitHub App, nhung khong dua raw data ra public.

On-chain/payment layer chi can:

```text
condition_hash
proof_hash
verification_result
verifier_identity
verified_at
```

### Vi du 1: Client so huu repo private

```text
Client: cong ty A
Repo: company/private-api
Developer: Bob
Deal: Tra 500 RIALO neu PR #42 merged truoc 2026-06-20
```

Flow:

1. Client connect wallet.
2. Client install GitHub App vao `company/private-api`.
3. Client tao escrow tren ProofPay.
4. Bob tao PR #42.
5. GitHub App verifier doc PR metadata.
6. Neu PR merged dung deadline, verifier tao proof hash.
7. ProofPay release RIALO cho Bob.

Ben thu ba khong thay code vi:

- Raw PR diff khong hien tren UI public.
- Verifier chi publish hash va result.
- Repo access van nam trong GitHub permission model.

### Vi du 2: Developer chi duoc invite vao repo

```text
Client: startup B
Developer: Alice
Repo: startup/private-web
Deal: Tra 200 RIALO neu Alice merge PR sua checkout bug
```

Flow:

1. Client install GitHub App.
2. Alice connect wallet.
3. Alice connect GitHub identity.
4. ProofPay map Alice GitHub username voi payee wallet.
5. Khi PR merged, verifier kiem tra author/reviewer/merge time.
6. Neu dung, release payment.

App khong can public code.

App chi can biet:

```text
PR # co ton tai khong
PR co merged khong
Merged luc nao
Author co dung khong
Checks co pass khong
```

### Vi du 3: Dispute hoac proof fail

```text
Deal: Tra 100 RIALO neu PR #10 merged truoc ngay 20
Thuc te: PR #10 chua merged hoac merge sau deadline
```

Ket qua:

- Verifier tra `PR_NOT_MERGED` hoac `MERGED_AFTER_DEADLINE`.
- Payment khong release.
- Client co the refund.

## 6. Phan nao la mock, phan nao la that?

Dang that:

- Express API.
- JSON persistence.
- GitHub public PR verification API.
- Deal state machine.
- Profile/session UI.
- GitHub OAuth route skeleton.

Dang mock/simulated:

- MetaMask/Phantom connect.
- RIALO token balance.
- Faucet.
- Rialo transaction hash.
- Escrow custody.
- GitHub App install state neu chua config env.

Luu y khi deploy Vercel:

- Vercel khong cho ghi vao thu muc bundle `/var/task`.
- Nen cau hinh Vercel KV hoac Upstash Redis REST de co store ben vung.
- Env can co: `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `PROOFPAY_STORE_KEY`.
- Neu khong co KV/Upstash, app fallback sang runtime temp dir.
- Tren Vercel, temp dir fallback la `/tmp/proofpay-rialo`.
- `/tmp` khong shared giua function instances va co the reset khi cold start/redeploy.
- Neu dung `/tmp`, bam Reload co the thay cac deal set khac nhau do request vao instance khac.
- Production can database/KV rieng.

Production can them:

- Real wallet adapter.
- Real RIALO token or Rialo asset.
- Real escrow contract/program.
- Real GitHub App credentials.
- Durable database or KV store.
- Secure token storage.
- Verifier identity/signature.
- Proof registry.

## 7. Demo script ngan

Dung script nay de demo nhanh:

```text
1. Dashboard: Logo, favicon, sidebar collapse, theme icon sang/toi.
2. Dashboard: ProofPay la proof-based escrow.
3. Connect Wallet: Tao profile bang wallet.
4. Faucet: Nhan 100 RIALO.
5. Profile: Connect GitHub va xem permissions.
6. Create Deal: Deploy GitHub PR escrow va auto-fund.
7. Proofs: Verify proof.
8. Escrows/Proofs: Release neu verified, refund neu fail.
9. Profile: Xem audit log.
```

Thong diep chinh:

```text
ProofPay bien thanh toan freelancer/bounty thanh workflow co dieu kien, co proof, co audit, va co the nang cap thanh Rialo-native escrow.
```
