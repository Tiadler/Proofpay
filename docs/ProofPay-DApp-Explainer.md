# ProofPay DApp Explainer

Tai lieu nay dung de giai thich ProofPay DApp la gi, no giai quyet van de nao, cac flow mau co the demo, va cac cau hoi co the dung khi review/pitch/test san pham.

## 1. ProofPay la gi?

ProofPay la mot DApp prototype cho thanh toan escrow dua tren bang chung.

Y tuong cot loi:

```text
Khoa tien truoc -> xac minh bang chung sau -> release hoac refund theo dieu kien
```

Vi du de hieu nhat:

```text
Client tra 100 RIALO cho developer neu GitHub PR #42 duoc merge truoc deadline.
```

ProofPay khong chi la man hinh gui token. No la mot programmable payment workflow:

```text
Payer tao deal
Payer khoa RIALO vao escrow
Payee lam viec va tao bang chung
Verifier kiem tra bang chung
He thong release tien neu dat dieu kien
He thong refund/dispute neu khong dat dieu kien
```

Trong ban prototype hien tai:

- Wallet MetaMask/Phantom la simulated trong browser session.
- RIALO balance, faucet, fund, release, refund la simulated ledger trong browser session.
- GitHub public PR verification co goi GitHub API that.
- Rialo adapter la mock adapter, chua phai transaction Rialo devnet/mainnet that.
- JSON/KV storage dung de luu deal state tren backend.
- Deploy Escrow Workflow chi tao deal neu connected wallet co du RIALO theo amount.
- RIALO chi bi tru khi bam `Fund`, khong bi tru ngay luc bam `Deploy Escrow Workflow`.

## 2. ProofPay giai quyet van de gi?

### 2.1 Van de trust trong thanh toan online

Trong freelancer, bounty, outsourcing, private repo work, va service online, hai ben thuong gap cac van de sau:

- Client khong muon tra tien truoc vi so nguoi lam khong giao viec.
- Developer khong muon lam xong moi doi tien vi so client khong tra.
- Neu dung chuyen token binh thuong, payment khong gan voi dieu kien cong viec.
- Neu dung escrow thu cong, can ben thu ba giu tien va xu ly tranh chap.
- Neu cong viec nam trong private repo, khong the public code de chung minh.
- Neu verify bang tay, de cham tre, thieu minh bach, kho audit.

### 2.2 Cach ProofPay giai quyet

ProofPay dua thanh toan vao escrow co dieu kien:

- Payer phai co du RIALO truoc khi tao workflow.
- Payer khoa tien vao escrow bang action `Fund`.
- Deal luu dieu kien thanh toan nhu GitHub owner, repo, PR number, expected author, deadline.
- Verifier kiem tra bang chung GitHub PR.
- Neu proof dat dieu kien, deal co the `Release`.
- Neu proof fail hoac deadline qua, deal co the `Refund` hoac `Dispute`.
- Moi buoc co event/audit trail de truy vet.

Gia tri cua ProofPay:

- Giam rui ro khong tra tien cho developer.
- Giam rui ro tra tien khi viec chua xong cho client.
- Bien payment thanh workflow co dieu kien, co proof, co audit.
- Mo duong cho escrow on-chain tren Rialo trong phien ban production.

## 3. Ai se dung ProofPay?

### 3.1 Client / payer

Client la nguoi muon tra tien khi cong viec dat dieu kien.

Vi du:

- Startup thue developer sua bug.
- Cong ty thue freelancer lam feature.
- DAO tao bounty cho PR duoc merge.
- Team san pham tra tien theo milestone.

Client can:

- Tao deal.
- Dat amount, deadline, repo, PR condition.
- Khoa RIALO vao escrow.
- Release neu proof hop le.
- Refund neu proof fail.

### 3.2 Developer / payee

Developer la nguoi nhan tien neu hoan thanh cong viec.

Developer can:

- Biet deal da duoc tao.
- Biet tien da duoc fund vao escrow hay chua.
- Lam viec va tao PR.
- Chung minh PR da merged.
- Nhan RIALO khi proof verified.

### 3.3 Verifier

Verifier la thanh phan kiem tra bang chung.

Trong prototype:

- Verifier doc GitHub public PR metadata qua GitHub API.
- Kiem tra PR co merged hay khong.
- Kiem tra expected author neu co.
- Kiem tra deadline neu co.
- Ghi proof hash/result vao deal.

Trong production:

- Verifier co the la backend service.
- Verifier co the dung GitHub App de doc private repo.
- Verifier chi publish proof metadata/hash, khong public raw private code.

## 4. ProofPay khac gi viec gui token binh thuong?

Gui token binh thuong:

```text
User A gui 100 RIALO cho User B
Ket thuc
```

ProofPay:

```text
User A tao deal co dieu kien
User A khoa 100 RIALO vao escrow
Bang chung duoc verify
Neu dat dieu kien -> release cho User B
Neu khong dat -> refund/dispute
Moi buoc co audit trail
```

Diem khac biet chinh:

- Payment co dieu kien.
- Payment co state machine.
- Payment co proof.
- Payment co audit.
- Payment co the tu dong hoa.

## 5. Flow tong quat cua DApp

```text
1. Connect Wallet
2. Faucet RIALO neu can demo balance
3. Create Deal voi amount, payer, payee, GitHub condition, deadline
4. App kiem tra payer wallet co du RIALO de tao workflow
5. Deal duoc tao o status DRAFT
6. Payer bam Fund de khoa RIALO vao escrow
7. Verifier kiem tra proof GitHub
8. Neu verified thi Release
9. Neu fail hoac khong lam xong thi Refund/Dispute
10. Xem audit trail va transaction hash mock
```

State chinh cua deal:

```text
DRAFT -> FUNDED -> VERIFIED -> RELEASED
DRAFT -> FUNDED -> REFUNDED
DRAFT -> FUNDED -> DISPUTED
DRAFT -> FUNDED -> REJECTED
```

## 6. Flow vi du mau

### Flow 1: Freelancer sua bug va duoc tra tien

Tinh huong:

```text
Client can sua bug checkout.
Developer nhan viec.
Client dong y tra 100 RIALO neu PR duoc merge truoc deadline.
```

Buoc demo:

1. Client connect wallet.
2. Client bam Faucet de co 100 RIALO hoac nhieu hon.
3. Client vao Create Deal.
4. Amount = 100.
5. Payer Address = wallet cua client.
6. Payee Address = wallet cua developer.
7. GitHub Owner/Repo/Pull Request = PR can verify.
8. Bam Deploy Escrow Workflow.
9. Deal xuat hien o Escrows voi status `DRAFT`.
10. Client bam `Fund`.
11. Balance client giam 100 RIALO trong session ledger.
12. Developer merge PR.
13. Client hoac he thong bam `Verify`.
14. Neu PR merged dung dieu kien, status -> `VERIFIED`.
15. Bam `Release`.
16. Deal status -> `RELEASED`.

Ket qua:

- Client chi tra tien khi proof dat.
- Developer thay tien da duoc khoa truoc khi lam.
- Ca hai ben co audit trail.

### Flow 2: Khong du RIALO nen khong tao duoc workflow

Tinh huong:

```text
Wallet chi co 100 RIALO.
User tao deal amount = 500 RIALO.
```

Buoc demo:

1. Connect wallet.
2. Kiem tra balance hien tai tren topbar.
3. Vao Create Deal.
4. Nhap Amount lon hon balance.
5. Bam Deploy Escrow Workflow.

Ket qua mong doi:

- App hien loi insufficient RIALO balance.
- Deal khong duoc tao.
- Backend khong nhan deal moi.
- User phai bam Faucet them hoac giam amount.

Y nghia:

- DApp khong cho tao payment workflow neu payer khong du kha nang fund.
- Giam deal rac va giam ky vong sai cho payee.

### Flow 3: Payer address khong khop wallet

Tinh huong:

```text
User connect MetaMask simulated.
Nhung trong form lai dien payer address cua Phantom hoac address khac.
```

Buoc demo:

1. Connect wallet MetaMask.
2. Vao Create Deal.
3. Sua Payer Address thanh address khac.
4. Bam Deploy Escrow Workflow.

Ket qua mong doi:

- App bao loi payer address phai trung voi connected wallet.
- Deal khong duoc tao.

Y nghia:

- Nguoi dung khong the tao workflow nhan danh vi khac.
- Khi fund, payer identity nhat quan voi wallet session.

### Flow 4: Proof fail va refund

Tinh huong:

```text
Client tao deal tra 100 RIALO neu PR #42 merged.
Nhung PR chua merged hoac PR number sai.
```

Buoc demo:

1. Tao deal.
2. Fund deal.
3. Bam Verify.
4. GitHub verifier tra ket qua fail.
5. Bam Refund.

Ket qua:

- Deal khong release cho payee.
- RIALO duoc hoan ve payer trong session ledger.
- Audit log co event refund.

Y nghia:

- Client khong bi mat tien khi dieu kien khong dat.
- Payment gan truc tiep voi proof thay vi loi hua.

### Flow 5: Deadline bi miss

Tinh huong:

```text
Deal yeu cau PR merged truoc ngay 20.
PR merged sau ngay 20 hoac chua merged.
```

Ket qua mong doi:

- Verifier reject proof.
- Deal co the refund hoac dispute.
- Audit trail ghi ly do verify fail.

Y nghia:

- Deadline tro thanh dieu kien thanh toan ro rang.
- Hai ben khong can tranh luan bang tay ve thoi diem hoan thanh.

### Flow 6: Private repo production

Tinh huong:

```text
Client co private repo.
Developer lam viec trong repo do.
Client khong muon public code.
```

Production flow de nang cap:

1. Client install GitHub App vao private repo.
2. GitHub App co quyen read metadata, PR, checks.
3. Developer tao PR.
4. Verifier backend doc PR metadata qua GitHub App.
5. Verifier khong public raw code/diff.
6. Verifier publish proof hash va verification result.
7. ProofPay release/refund theo result.

Du lieu can publish:

```text
condition_hash
proof_hash
verification_result
verifier_identity
verified_at
```

Y nghia:

- Chung minh cong viec hoan thanh ma khong lam lo source code.
- Phu hop voi private repo, enterprise, outsourcing.

### Flow 7: Milestone payment

Tinh huong:

```text
Client thue agency lam 3 milestone.
Moi milestone co amount va proof rieng.
```

Cach dung ProofPay:

1. Tao 3 deal rieng.
2. Moi deal co deadline rieng.
3. Moi deal gan voi PR, issue, release tag, hoac proof type rieng.
4. Fund tung deal.
5. Verify/release tung milestone.

Y nghia:

- Khong can release toan bo ngan sach mot lan.
- Giam risk cho ca client va agency.
- Moi milestone co audit rieng.

## 7. Cac tinh huong nen demo

### Demo nhanh 5 phut

```text
1. Dashboard: giai thich ProofPay la proof-based escrow.
2. Connect Wallet: tao payer identity.
3. Faucet: nap 100 RIALO simulated.
4. Create Deal: tao deal amount <= balance.
5. Escrows: Fund deal va xem balance bi tru.
6. Verify: kiem tra GitHub PR.
7. Release hoac Refund.
```

### Demo loi so du

```text
1. Connect wallet.
2. De balance thap.
3. Tao deal amount lon hon balance.
4. App block Deploy Escrow Workflow.
5. Bam Faucet hoac giam amount.
6. Deploy lai thanh cong.
```

### Demo proof fail

```text
1. Tao deal voi PR number sai hoac PR chua merged.
2. Fund.
3. Verify.
4. Proof rejected.
5. Refund.
```

### Demo private repo narrative

```text
1. Vao Profile.
2. Connect GitHub simulated.
3. Giai thich GitHub App scoped permissions.
4. Noi ro prototype chua doc private repo that neu chua cau hinh OAuth/App.
5. Giai thich production se publish hash/result, khong public code.
```

## 8. Cac cau hoi co the dat ra ve DApp

### 8.1 Cau hoi san pham

- ProofPay la gi trong mot cau?
- ProofPay giai quyet van de nao cho client?
- ProofPay giai quyet van de nao cho developer?
- Tai sao can escrow thay vi gui token truc tiep?
- Payment workflow khac gi voi payment transaction binh thuong?
- ProofPay phu hop voi freelancer, bounty, DAO hay enterprise hon?
- Ai la nguoi tao deal?
- Ai la nguoi fund deal?
- Ai la nguoi nhan tien?
- Khi nao tien duoc release?
- Khi nao tien duoc refund?
- Neu hai ben tranh chap thi xu ly nhu the nao?
- ProofPay co phai san pham chi danh cho GitHub khong?
- Ngoai GitHub PR, co the them proof type nao khac?
- Gia tri chinh cua audit trail la gi?

### 8.2 Cau hoi user flow

- User phai lam gi dau tien khi vao DApp?
- Vi sao phai connect wallet?
- Faucet dung de lam gi trong demo?
- Khi nao app khong cho Deploy Escrow Workflow?
- Amount phai thoa dieu kien nao?
- Payer Address vi sao phai trung voi connected wallet?
- Sau khi Deploy Escrow Workflow, deal o status nao?
- Khi nao RIALO bi tru khoi payer balance?
- Nut `Fund` co tac dung gi?
- Nut `Verify` co tac dung gi?
- Nut `Release` co tac dung gi?
- Nut `Refund` co tac dung gi?
- Vi sao deal khong hien neu chua co persistent store dung tren Vercel?
- Filter status trong Escrows nen hoat dong nhu the nao?

### 8.3 Cau hoi proof va GitHub

- Proof trong ProofPay la gi?
- GitHub PR verifier kiem tra nhung truong nao?
- PR merged duoc xac dinh bang cach nao?
- Expected author dung de lam gi?
- Deadline duoc kiem tra nhu the nao?
- Neu PR khong ton tai thi deal ra sao?
- Neu PR merged sau deadline thi deal ra sao?
- Neu PR merged boi nguoi khac thi deal ra sao?
- Private repo co verify duoc khong?
- GitHub App can nhung permission nao?
- Vi sao khong nen public raw private repo data?
- Proof hash co tac dung gi?
- Verifier identity co tac dung gi?

### 8.4 Cau hoi ky thuat

- App hien tai phan nao la real va phan nao la mock?
- Wallet MetaMask/Phantom hien tai co goi extension that khong?
- RIALO balance hien tai duoc luu o dau?
- Deal state duoc luu o dau?
- Vi sao Vercel khong nen ghi vao `/var/task/data`?
- Khi nao can Vercel KV hoac Upstash Redis?
- Neu khong co KV, vi sao data co the luc hien luc mat?
- Rialo adapter hien tai lam gi?
- Can gi de bien mock adapter thanh Rialo devnet transaction that?
- State machine cua deal gom nhung status nao?
- Lam sao tranh fund hai lan?
- Lam sao tranh release khi chua verified?
- API nao tao deal?
- API nao fund deal?
- API nao verify GitHub proof?
- API nao release/refund?
- Cache API tren Vercel co anh huong gi khong?

### 8.5 Cau hoi bao mat va trust

- Ai co quyen release tien?
- Ai co quyen refund tien?
- Neu verifier sai thi sao?
- Neu GitHub API downtime thi sao?
- Neu user dien sai payer/payee address thi sao?
- Neu payee khong connect wallet thi tien release vao dau?
- Lam sao chung minh proof khong bi sua?
- Lam sao bao ve private repo data?
- Co can multisig/admin arbitration khong?
- Co can oracle/verifier reputation khong?
- Co can signature tu payer/payee khong?

### 8.6 Cau hoi business

- Khach hang dau tien cua ProofPay la ai?
- Use case nao nen tap trung dau tien?
- ProofPay thu phi bang cach nao?
- Doi thu cua ProofPay la ai?
- Loi the cua ProofPay so voi escrow platform tap trung la gi?
- Loi the cua ProofPay so voi smart contract escrow thong thuong la gi?
- Thi truong nao can proof-based payments nhat?
- Lam sao thuyet phuc developer dung?
- Lam sao thuyet phuc client fund tien truoc?
- Can nhung integration nao de production-ready?

## 9. Cau tra loi ngan nen chuan bi

### ProofPay la gi?

```text
ProofPay la DApp escrow theo bang chung: payer khoa RIALO, verifier kiem tra proof nhu GitHub PR merged, sau do tien duoc release hoac refund theo dieu kien.
```

### No giai quyet van de gi?

```text
No giai quyet van de thieu trust trong thanh toan online: client so tra tien truoc, developer so lam xong khong duoc tra. ProofPay dua tien vao escrow va chi release khi co proof.
```

### Tai sao can Rialo?

```text
Rialo la lop payment/adapter muc tieu de bien workflow thanh programmable payment co the audit va nang cap on-chain. Ban hien tai dung mock adapter de demo UX va state machine truoc.
```

### Phan nao dang mock?

```text
Wallet, RIALO balance, faucet, escrow custody, transaction hash Rialo dang simulated. GitHub public PR verification va backend API la logic that trong prototype.
```

### Khi nao tien bi tru?

```text
Deploy chi tao deal neu wallet co du RIALO theo amount. Tien chi bi tru trong simulated ledger khi payer bam Fund.
```

### Neu khong du RIALO thi sao?

```text
App chan Deploy Escrow Workflow va khong tao deal moi. User phai faucet them RIALO hoac giam amount.
```

### Private repo co dung duoc khong?

```text
Co the nang cap production bang GitHub App voi scoped permissions. Verifier doc metadata private repo, nhung chi publish proof hash va result, khong public source code.
```

### Huong production la gi?

```text
Thay simulated wallet bang wallet adapter that, thay mock Rialo adapter bang Rialo devnet/mainnet transaction, dung KV/database ben vung, va dung GitHub App verifier cho private repo.
```

## 10. Q&A team co the hoi trong buoi review

### 10.1 Product va problem

#### Q: ProofPay la DApp de lam gi?

```text
ProofPay la DApp escrow theo bang chung. No giup payer khoa RIALO truoc, dat dieu kien thanh toan, verifier kiem tra proof, roi release hoac refund theo ket qua.
```

#### Q: Van de that su ma ProofPay giai quyet la gi?

```text
No giai quyet trust gap trong thanh toan online: client khong muon tra tien truoc khi viec xong, developer khong muon lam xong roi moi doi tien. ProofPay dat tien vao escrow va dung proof de quyet dinh release/refund.
```

#### Q: Tai sao khong gui token truc tiep?

```text
Gui token truc tiep chi la transaction mot chieu. ProofPay la workflow co state: DRAFT, FUNDED, VERIFIED, RELEASED, REFUNDED. Payment gan voi dieu kien, proof, audit trail va co the tu dong hoa.
```

#### Q: Use case dau tien nen tap trung la gi?

```text
Use case tot nhat cho prototype la GitHub PR escrow cho freelancer, bounty, hoac milestone engineering. Day la case de demo vi co proof ro rang: PR merged, author, deadline, repo metadata.
```

#### Q: Ai la user chinh?

```text
User chinh gom client/payer va developer/payee. Client tao deal va fund escrow. Developer lam viec va nhan tien khi proof dat. Verifier la thanh phan kiem tra bang chung.
```

#### Q: ProofPay co chi danh cho developer/GitHub khong?

```text
Khong. GitHub PR la proof type dau tien vi de demo va co API ro rang. Kien truc co the mo rong sang proof khac: issue closed, release tag, invoice approved, oracle event, delivery confirmation, milestone acceptance.
```

### 10.2 Demo va user flow

#### Q: Flow demo ngan nhat la gi?

```text
Connect wallet -> Faucet RIALO -> Create Deal amount <= balance -> Fund -> Verify GitHub PR -> Release neu verified hoac Refund neu fail.
```

#### Q: Khi bam Deploy Escrow Workflow thi chuyen gi xay ra?

```text
App kiem tra wallet da connect, payer address trung voi wallet, amount hop le va wallet co du RIALO. Neu dat, backend tao deal DRAFT. Tien chua bi tru o buoc Deploy.
```

#### Q: Khi nao RIALO bi tru khoi vi?

```text
RIALO bi tru trong simulated ledger khi payer bam Fund. Deploy chi tao workflow va block neu amount lon hon balance.
```

#### Q: Tai sao phai check balance ngay luc Deploy neu tien chua bi tru?

```text
De tranh tao deal rac ma payer khong co kha nang fund. Day la guard UX va business logic: payee khong nen thay mot deal ma payer khong du balance de fund.
```

#### Q: Neu amount lon hon balance thi sao?

```text
App hien loi insufficient RIALO balance va khong goi API tao deal. User phai faucet them RIALO hoac giam amount.
```

#### Q: Neu payer address khong trung wallet dang connect thi sao?

```text
App chan Deploy va Fund. Payer address phai trung connected wallet de tranh user tao deal thay mat vi khac.
```

#### Q: Neu payee address khong phai wallet dang connect thi release vao dau?

```text
Trong prototype, release cong RIALO vao ledger theo payee address. Neu payee khong phai wallet dang connect, topbar se khong hien balance do, nhung ledger van ghi theo address.
```

### 10.3 Mock vs real

#### Q: Phan nao cua app la real?

```text
Express API, deal state machine, GitHub public PR verification, storage layer, UI flow, tests va GitHub OAuth/App backend skeleton la real trong prototype.
```

#### Q: Phan nao dang mock?

```text
Wallet connect, RIALO balance, faucet, escrow custody, Rialo transaction hash va Rialo adapter dang simulated/mock. Chua co real on-chain custody.
```

#### Q: Neu la mock thi gia tri cua prototype la gi?

```text
Prototype validate product flow, UX, state machine, proof verification, adapter boundary va production integration path truoc khi ton chi phi build on-chain custody that.
```

#### Q: Co tien that bi khoa khong?

```text
Khong. Ban hien tai khong custody real asset. Tat ca RIALO balance va transfer la simulated trong browser session.
```

#### Q: Rialo adapter hien tai lam gi?

```text
MockRialoAdapter tra ve transaction-shaped response cho create escrow, fund, anchor proof, release va refund. No giup UI/backend lam viec voi contract-like interface ma chua can Rialo devnet.
```

#### Q: Can gi de bien thanh on-chain that?

```text
Can real Rialo wallet adapter, escrow program/service, transaction signing, custody logic, verifier attestation, persistent database/KV, va security review.
```

### 10.4 GitHub proof va private repo

#### Q: Verifier GitHub kiem tra gi?

```text
Verifier kiem tra owner, repo, PR number, merged status, merge time so voi deadline, va expected author neu co.
```

#### Q: Neu PR khong merged thi sao?

```text
Proof bi reject. Deal khong the release theo flow verified, payer co the refund hoac dispute tuy chinh sach.
```

#### Q: Neu PR merged sau deadline thi sao?

```text
Verifier reject voi ly do deadline khong dat. Payment khong release tu dong.
```

#### Q: Private repo co verify duoc khong?

```text
Prototype hien tai demo public PR verification va co GitHub App/OAuth skeleton. Production private repo can GitHub App voi scoped permissions de verifier doc metadata private ma khong public raw code.
```

#### Q: Lam sao bao ve private repo code?

```text
Verifier chi publish condition_hash, proof_hash, verification_result, verifier_identity va verified_at. Raw PR diff/source code khong dua len UI public hoac payment layer.
```

#### Q: Neu GitHub API downtime thi sao?

```text
Verify se fail tam thoi hoac can retry. Production nen co retry policy, status pending, timeout, va fallback dispute/manual arbitration.
```

### 10.5 Storage va Vercel

#### Q: Vi sao tren Vercel data co luc hien luc mat?

```text
Neu khong dung KV/Upstash, app fallback sang /tmp tren serverless. /tmp khong shared giua function instances va co the reset, nen request khac nhau co the thay data set khac nhau.
```

#### Q: Lam sao biet deploy dang dung storage dung?

```text
Mo /api/system/storage. Neu provider la remote-kv thi data on dinh. Neu provider la temp-file thi van dang dung temp storage va khong nen demo persistence nghiem tuc.
```

#### Q: Env nao quan trong nhat tren Vercel?

```text
KV_REST_API_URL, KV_REST_API_TOKEN, PROOFPAY_STORE_KEY la nhom quan trong de co durable store. GITHUB_TOKEN hoac GitHub OAuth/App env dung cho verification/GitHub flow.
```

#### Q: Co nen commit data/proofpay.json khong?

```text
Khong. Day la local/demo state. Production nen dung KV/database. Repo chi nen commit schema/code/docs, khong commit runtime data.
```

### 10.6 Security va trust

#### Q: Ai co quyen release/refund?

```text
Prototype cho user thao tac action trong UI. Production can role policy ro rang: payer, payee, verifier, admin/arbitrator, va signature/authorization.
```

#### Q: Neu verifier bi sai hoac bi compromise thi sao?

```text
Production can verifier identity, signed attestation, audit log, dispute window, va co the dung multi-verifier hoac reputation/oracle policy cho use case risk cao.
```

#### Q: Lam sao tranh fund/release nhieu lan?

```text
State machine phai enforce transition hop le. Deal da FUNDED khong duoc fund lai; deal chua VERIFIED khong nen release; deal RELEASED/REFUNDED la terminal state.
```

#### Q: Co can audit/security review khong?

```text
Co. Khi chuyen sang real asset custody, can audit smart contract/program, backend authorization, wallet signing, replay protection, verifier attestation va storage security.
```

#### Q: Proof hash co tac dung gi?

```text
Proof hash la dau vet bat bien cua ket qua verification. No giup audit ket qua ma khong can public raw private data.
```

### 10.7 Business va roadmap

#### Q: Loi the cua ProofPay so voi escrow tap trung la gi?

```text
ProofPay co the minh bach hon, programmable hon, audit duoc, va co kha nang on-chain custody thay vi phu thuoc hoan toan vao ben thu ba tap trung.
```

#### Q: Loi the so voi smart contract escrow thong thuong la gi?

```text
ProofPay khong chi khoa tien. No gan escrow voi off-chain proof verifier nhu GitHub, workflow UI, audit trail, va integration path cho private repo.
```

#### Q: Mo hinh doanh thu co the la gi?

```text
Co the thu platform fee tren successful release, subscription cho team/private repo verification, enterprise verifier service, hoac fee cho premium dispute/arbitration workflow.
```

#### Q: MVP production can nhung gi?

```text
Real wallet integration, durable database/KV, GitHub App verifier cho private repo, authorization policy, escrow custody on Rialo/devnet, event/audit hardening, va basic admin/dispute process.
```

#### Q: Rui ro lon nhat la gi?

```text
Rui ro lon nhat la custody/security khi chuyen sang asset that, verifier trust, data persistence tren serverless, va viec dinh nghia proof condition du ro de tranh dispute.
```

#### Q: Buoc tiep theo nen lam la gi?

```text
Chot MVP scope: GitHub PR escrow only. Sau do them real wallet adapter, remote KV bat buoc tren Vercel, GitHub App verifier, va Rialo transaction adapter/service.
```

## 11. Use case questions nen chuan bi ky

Day la nhom cau hoi kha nang cao se duoc hoi nhieu nhat neu khan gia tap trung vao san pham/use case.

### Q: Use case thuc te nhat cua ProofPay la gi?

```text
Use case thuc te nhat la milestone/freelancer payment cho engineering work. Vi du client fund 100 RIALO vao escrow, developer merge GitHub PR dung deadline, verifier xac nhan PR merged, sau do tien duoc release.
```

### Q: Tai sao developer se muon dung ProofPay?

```text
Developer thay tien da duoc fund vao escrow truoc khi lam. Dieu nay giam rui ro lam xong nhung client khong tra. Developer chi can giao proof ro rang nhu PR merged de nhan tien.
```

### Q: Tai sao client se muon dung ProofPay?

```text
Client khong phai tra tien truc tiep truoc. Tien duoc khoa trong escrow va chi release khi proof dat dieu kien. Neu proof fail, client co the refund/dispute.
```

### Q: Use case nao nen demo dau tien?

```text
Demo GitHub PR escrow: "Pay 100 RIALO if PR #42 is merged before deadline." Case nay de hieu, co proof ro, va phu hop voi builder audience.
```

### Q: Ngoai GitHub PR, ProofPay co the mo rong sang dau?

```text
Co the mo rong sang issue closed, test suite passed, release tag created, invoice approved, delivery confirmed, DAO bounty accepted, oracle event, shipment completed, hoac milestone approved.
```

### Q: ProofPay co phu hop voi non-dev use case khong?

```text
Co, neu use case co proof machine-readable. Vi du payment khi invoice duoc approve, khi shipment duoc delivered, khi content duoc accepted, khi KPI/off-chain oracle dat nguong.
```

### Q: Tai sao khong dung Upwork/Fiverr escrow?

```text
Upwork/Fiverr la escrow tap trung va bi khoa trong platform. ProofPay huong toi programmable escrow co audit, co proof verifier, co the on-chain, va co the tich hop vao workflow rieng cua team/DAO.
```

### Q: Tai sao khong dung multisig?

```text
Multisig giai quyet custody nhung khong giai quyet proof automation. ProofPay them condition, verifier, state machine, UX, va audit trail cho payment workflow.
```

### Q: Ai la khach hang dau tien?

```text
Nhom builder/freelancer/DAO bounty/team engineering la khach hang dau tien hop ly. Ho co proof ro tren GitHub va gap van de trust trong milestone payment.
```

### Q: Deal co the co nhieu milestone khong?

```text
Prototype nen tao moi milestone la mot deal rieng. Production co the them parent project gom nhieu escrow con, moi escrow co amount, proof, deadline rieng.
```

### Q: Neu client va developer bat dong ve proof thi sao?

```text
Can dispute flow. Prototype co status DISPUTED, production can arbitration policy: manual reviewer, multisig, verifier retry, evidence submission, va dispute deadline.
```

### Q: Use case nao khong nen lam o MVP?

```text
Khong nen lam use case proof mo ho, khong co API ro rang, hoac can legal arbitration phuc tap. MVP nen tap trung vao GitHub PR escrow vi proof ro va builder de hieu.
```

## 12. Builder technical questions ve code va co che

Day la nhom cau hoi kha nang cao tu builder/dev audience. Nen tra loi ngan, ro tradeoff, va chi ra production path.

### Q: Tech stack la gi?

```text
Backend la Node.js/Express. Frontend la static HTML/CSS/JavaScript khong framework. Storage la jsonStore abstraction, co local JSON fallback va remote KV/Upstash REST mode. Tests dung Node built-in test runner.
```

### Q: Vi sao khong dung React/Next?

```text
Prototype uu tien shipping nhanh va minh bach flow. Static UI giup deploy don gian, it abstraction. Neu production UI lon hon, co the migrate sang React/Next ma giu API/state machine/adapters.
```

### Q: State cua deal nam o dau?

```text
Deal state nam trong backend store qua src/storage/jsonStore.js. Store gom deals, proofs/events summary va du lieu can cho API. Tren Vercel nen dung remote KV/Upstash de tranh /tmp unstable.
```

### Q: State machine enforce o dau?

```text
Backend routes trong src/routes/deals.js enforce cac transition chinh nhu fund, verify, release, refund, dispute. Frontend disable button theo status de UX tot hon, nhung backend moi la noi nen enforce rule that.
```

### Q: Neu user goi API truc tiep bo qua UI thi sao?

```text
Prototype chua co auth production. Mot so transition co backend guard, nhung production can wallet signature/session auth, role-based authorization va validation chat hon o API.
```

### Q: Wallet simulation hoat dong the nao?

```text
Frontend tao wallet mock MetaMask/Phantom va luu session trong browser storage. RIALO balance nam trong browser-session ledger. Day chi la simulator, khong goi extension that.
```

### Q: Deploy Escrow Workflow check balance o dau?

```text
Frontend check connected wallet, payer address, amount va currentLedgerBalance truoc khi POST /api/deals. Muc dich la chan UX flow sai. Production can check/lock balance on-chain khi funding transaction duoc sign.
```

### Q: Tai sao Deploy khong tru tien luon?

```text
Sau rollback, Deploy chi tao deal DRAFT neu wallet co du balance. Tien bi tru khi Fund. Cach nay giu state machine ro: create intent truoc, lock funds sau.
```

### Q: Fund tru tien o dau?

```text
Frontend enforceFundSimulation tru balance trong session ledger sau khi goi backend fund API thanh cong. Backend chuyen deal status sang FUNDED va mock adapter tao funding tx hash.
```

### Q: Neu balance frontend co the bi sua thi sao?

```text
Prototype chap nhan vi la simulator. Production khong tin frontend balance. Balance/fund phai duoc verify on-chain qua signed transaction va program state.
```

### Q: Mock Rialo adapter interface nhu the nao?

```text
Adapter co method createEscrow, fundEscrow, anchorProof, releasePayment, refundPayment va networkInfo. Backend route goi adapter thay vi hard-code chain logic, de sau nay thay MockRialoAdapter bang real Rialo adapter/service.
```

### Q: Vi sao dung adapter pattern?

```text
Adapter tach product workflow khoi chain implementation. UI/API co the giu flow cu, con adapter co the doi tu mock sang Rialo devnet/mainnet hoac Rust microservice.
```

### Q: Proof hash tao nhu the nao?

```text
Backend verifier lay PR metadata va tao proof/result payload. Proof hash nen la hash cua condition + verification result + relevant metadata. Prototype mo phong/ghi proof hash de audit.
```

### Q: Condition hash co tac dung gi?

```text
Condition hash dai dien cho dieu kien deal tai thoi diem tao. No giup chung minh proof duoc verify theo dung dieu kien ban dau, khong bi doi rule sau khi fund.
```

### Q: GitHub verifier nam o dau?

```text
GitHub verifier nam trong src/verifiers/githubPrVerifier.js. Route verify nam trong src/routes/deals.js va goi verifier de kiem tra PR merged, deadline, expected author.
```

### Q: Co test cho adapter/verifier/storage khong?

```text
Co. Test nam trong test/*.test.js, gom mock Rialo adapter, GitHub PR verifier va jsonStore/serverless storage behavior.
```

### Q: Build check lam gi?

```text
scripts/build-check.js validate syntax cua JS backend/browser va required assets nhu logo. Vi app static/Express, build check dong vai tro sanity check thay cho bundler.
```

### Q: Vercel deploy hoat dong nhu the nao?

```text
Express app chay nhu serverless function/legacy server entry. Static files trong public duoc serve. API route goi storage. Neu khong co remote KV thi state co the unstable tren /tmp.
```

### Q: Vi sao .npm-cache khong nen commit?

```text
.npm-cache la runtime/dependency cache cuc bo, khong phai source code. Commit no lam repo nang, nhieu file noise, va khong can cho build/deploy.
```

### Q: Neu muon production-ready, code can doi gi dau tien?

```text
Thu tu uu tien: remote DB/KV bat buoc, auth/wallet signature, real wallet adapter, Rialo escrow adapter/service, GitHub App verifier, backend role checks, dispute policy, va observability.
```

### Q: Neu build on-chain, escrow program can state gi?

```text
Can payer, payee, amount, token, condition_hash, status, deadline, verifier identity/policy, funding tx, proof hash, release/refund tx, created_at, updated_at.
```

### Q: Lam sao tranh race condition khi hai request release/refund cung luc?

```text
Production store/program can atomic transition hoac on-chain state lock. Route phai check current status va update atomically. KV JSON prototype chua du cho concurrent finance-grade workflow.
```

### Q: Co nen verify proof on-chain khong?

```text
GitHub proof thuong la off-chain. On-chain nen luu proof hash/result/verifier signature, con raw GitHub API verification nam off-chain. Neu can trust-minimized hon, dung signed verifier attestation hoac multi-verifier.
```

## 13. Thong diep pitch ngan

```text
ProofPay bien thanh toan freelancer, bounty, va milestone thanh workflow co dieu kien: tien duoc khoa truoc, bang chung duoc verify sau, va payment duoc release/refund minh bach theo ket qua. Prototype hien tai demo state machine, GitHub proof, wallet/RIALO session, va duong nang cap sang Rialo-native escrow.
```
