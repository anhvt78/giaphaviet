# Tài Liệu Hướng Dẫn Sử Dụng — Genealogy Smart Contract

## Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Kiến trúc](#2-kiến-trúc)
3. [Kiểu dữ liệu](#3-kiểu-dữ-liệu)
4. [Triển khai hợp đồng](#4-triển-khai-hợp-đồng) · [Địa chỉ Mainnet](#40-địa-chỉ-đã-deploy-trên-lukso-mainnet) · [Kết nối Frontend](#41-kết-nối-từ-frontend-ethersjs-v6) · [ABI](#42-lấy-abi)
5. [Genealogy Registry — Hướng dẫn sử dụng](#5-genealogy-registry--hướng-dẫn-sử-dụng)
6. [FamilyNFT — Hướng dẫn sử dụng](#6-familynft--hướng-dẫn-sử-dụng)
7. [Liên kết xuyên gia phả](#7-liên-kết-xuyên-gia-phả)
8. [Events](#8-events)
9. [Phân quyền](#9-phân-quyền)
10. [Lưu ý bảo mật](#10-lưu-ý-bảo-mật)
11. [Luồng nghiệp vụ phổ biến](#11-luồng-nghiệp-vụ-phổ-biến)

---

## 1. Tổng quan hệ thống

Hệ thống gồm ba hợp đồng chính:

| Hợp đồng | Vai trò |
|----------|---------|
| `Genealogy` | Registry trung tâm — quản lý danh sách các gia phả, factory tạo gia phả mới |
| `FamilyNFT` | Hợp đồng đại diện cho một dòng họ — mỗi thành viên là một NFT token (LSP8) |
| `FamilyTypes` | Library dùng chung — định nghĩa kiểu dữ liệu và hàm validation |

**Điểm nổi bật:**
- Mỗi gia phả là một **minimal proxy clone** (EIP-1167) của `FamilyNFT`, tiết kiệm ~10× gas so với deploy contract đầy đủ.
- Mỗi thành viên trong gia phả là một **LSP8 NFT token** — tương thích với hệ sinh thái LUKSO.
- Hỗ trợ đầy đủ quan hệ **xuyên gia phả**: vợ/chồng từ dòng họ khác, nhập thành viên, và liên kết dòng họ chung gốc tổ.

---

## 2. Kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│                   Genealogy (Registry)                   │
│  - Quản lý danh sách clan                               │
│  - Clone factory (EIP-1167)                             │
│  - Governance: pause/unpause clan                        │
│  - Liên kết gia phả chung gốc                           │
└──────────────────────┬──────────────────────────────────┘
                       │ Clones.clone(implementation)
          ┌────────────┴────────────┐
          │       FamilyNFT         │     FamilyNFT       FamilyNFT
          │  (Clone — Clan A)       │    (Clan B)...     (Clan C)...
          │  - LSP8 tokens          │
          │  - Quản lý thành viên   │
          │  - Quan hệ gia đình     │
          │  - Cross-clan links     │
          └────────────┬────────────┘
                       │ import
          ┌────────────┴────────────┐
          │      FamilyTypes        │
          │  (Library)              │
          │  - DateInfo, Person     │
          │  - ExternalRef          │
          │  - Validation functions │
          └─────────────────────────┘
```

**Token ID:**
- Token ID `0x000...001` (`ANCESTOR_TOKEN_ID`) là tổ tiên sáng lập — owner của token này là admin của cả dòng họ.
- Các token tiếp theo được đánh số tuần tự: `2`, `3`, `4`...

---

## 3. Kiểu dữ liệu

### `FamilyTypes.Sex` (enum)

| Giá trị | Ý nghĩa |
|---------|---------|
| `0` — `MALE` | Nam |
| `1` — `FEMALE` | Nữ |
| `2` — `UNDEFINED` | Không xác định |

### `FamilyTypes.DateInfo` (struct)

```solidity
struct DateInfo {
    uint8  day;    // Ngày (1–31), 0 = không rõ
    uint8  month;  // Tháng (1–12), 0 = không rõ
    uint16 year;   // Năm, 0 = không rõ
}
```

> **Lưu ý:** Ngày `{0, 0, 0}` có nghĩa là "không biết" và luôn hợp lệ. Nếu có bất kỳ trường nào khác 0, tháng phải trong `[1,12]` và ngày trong `[1,31]`.

### `FamilyTypes.ExternalRef` (struct)

```solidity
struct ExternalRef {
    address contractAddress; // Địa chỉ FamilyNFT contract của gia phả khác
    bytes32 tokenId;         // Token ID của người trong gia phả đó
}
```

### `FamilyTypes.Person` (struct)

```solidity
struct Person {
    string         name;            // Họ tên
    bytes32        parentId;        // Token ID của cha/mẹ (0 = không có)
    bytes32[]      children;        // Danh sách con
    bytes32[]      spouses;         // Danh sách vợ/chồng cùng gia phả
    ExternalRef[]  externalSpouses; // Danh sách vợ/chồng từ gia phả khác
    Sex            sex;             // Giới tính
    DateInfo       birthDate;       // Ngày sinh
    DateInfo       deathDate;       // Ngày mất
    bool           isDeceased;      // Đã mất chưa
    string         shortDesc;       // Mô tả ngắn
    uint256        createdAt;       // Timestamp tạo (block.timestamp)
}
```

> **Quy tắc:** Nếu `deathDate` có giá trị (khác `{0,0,0}`), thì `isDeceased` **bắt buộc** phải là `true`.

---

## 4. Triển khai hợp đồng

### 4.0 Địa chỉ đã deploy trên LUKSO Mainnet

> Đây là địa chỉ production. Frontend kết nối trực tiếp vào các địa chỉ này.

| Contract | Địa chỉ | Ghi chú |
|----------|---------|---------|
| **FamilyNFT** (implementation) | `0x4483CC54F38f2E16c466c5Db6E525D93aF2eAf4a` | Template clone — **không tương tác trực tiếp** |
| **Genealogy** (registry) | `0x0369579Fcb566C521Ca2b2807ce39bde76CeC518` | Contract chính frontend gọi |

**Thông tin mạng:**

| Thông số | Giá trị |
|----------|---------|
| Network | LUKSO Mainnet |
| Chain ID | `42` |
| RPC URL | `https://rpc.mainnet.lukso.network` |
| Block Explorer | `https://explorer.execution.mainnet.lukso.network` |
| Native Token | LYX |

**Xem trên explorer:**
- Genealogy: `https://explorer.execution.mainnet.lukso.network/address/0x0369579Fcb566C521Ca2b2807ce39bde76CeC518`
- FamilyNFT: `https://explorer.execution.mainnet.lukso.network/address/0x4483CC54F38f2E16c466c5Db6E525D93aF2eAf4a`

---

### 4.1 Kết nối từ Frontend (ethers.js v6)

```javascript
import { ethers } from "ethers";
import GenealogyABI  from "./abi/Genealogy.json";
import FamilyNFTABI  from "./abi/FamilyNFT.json";

const GENEALOGY_ADDRESS  = "0x0369579Fcb566C521Ca2b2807ce39bde76CeC518";
const LUKSO_MAINNET_RPC  = "https://rpc.mainnet.lukso.network";

// Đọc dữ liệu (không cần ký)
const provider  = new ethers.JsonRpcProvider(LUKSO_MAINNET_RPC);
const genealogy = new ethers.Contract(GENEALOGY_ADDRESS, GenealogyABI, provider);

// Ghi dữ liệu (cần ký — kết nối ví người dùng)
const browserProvider = new ethers.BrowserProvider(window.lukso); // LUKSO UP Extension
const signer  = await browserProvider.getSigner();
const genealogySigner = genealogy.connect(signer);

// Tương tác với FamilyNFT clone (địa chỉ lấy từ createClan hoặc getClan)
const clanAddress = await genealogy.getClan(1);
const familyNFT   = new ethers.Contract(clanAddress, FamilyNFTABI, signer);
```

> **Lưu ý:** `FamilyNFT implementation` (`0x4483...`) **không** dùng để tương tác. Mỗi gia phả có địa chỉ clone riêng — lấy qua `Genealogy.getClan(index)` hoặc event `ClanCreated`.

---

### 4.2 Lấy ABI

ABI được tạo tự động khi compile. Lấy từ thư mục `artifacts/` trong project:

```
artifacts/contracts/genealogy.sol/Genealogy.json     → field "abi"
artifacts/contracts/familyNFT.sol/FamilyNFT.json     → field "abi"
```

Copy hai file JSON này vào thư mục `abi/` của dự án frontend.

---

### 4.3 Deploy mới (nếu cần)

> Chỉ cần nếu deploy lại từ đầu. Với hệ thống đang chạy, bỏ qua bước này.

### Bước 1: Deploy `FamilyNFT` (Implementation)

Deploy một lần duy nhất. Contract này không dùng trực tiếp — chỉ làm template cho các clone.

```
Constructor: không có tham số
```

Lưu lại địa chỉ deploy được: **`IMPLEMENTATION_ADDRESS`**

### Bước 2: Deploy `Genealogy` (Registry)

```solidity
constructor(address implementation_)
```

| Tham số | Mô tả |
|---------|-------|
| `implementation_` | Địa chỉ `FamilyNFT` đã deploy ở Bước 1 |

> Sau khi deploy, `msg.sender` trở thành `owner` của `Genealogy` registry.

---

## 5. Genealogy Registry — Hướng dẫn sử dụng

### 5.1 Tạo gia phả mới

```solidity
function createClan(
    string memory clanName,
    string memory clanShortDesc,
    string memory ancestorName,
    string memory ancestorShortDesc,
    FamilyTypes.DateInfo memory birthDate,
    FamilyTypes.DateInfo memory deathDate,
    bool isDeceased,
    FamilyTypes.Sex ancestorSex
) external returns (address clanAddress)
```

Tạo một gia phả mới bằng cách clone `FamilyNFT`, khởi tạo với tổ tiên sáng lập, và đăng ký vào registry.

| Tham số | Mô tả |
|---------|-------|
| `clanName` | Tên dòng họ (bắt buộc, không được rỗng) |
| `clanShortDesc` | Mô tả ngắn về dòng họ |
| `ancestorName` | Tên tổ tiên sáng lập (bắt buộc) |
| `ancestorShortDesc` | Mô tả ngắn về tổ tiên |
| `birthDate` | Ngày sinh tổ tiên (`{0,0,0}` nếu không rõ) |
| `deathDate` | Ngày mất tổ tiên (`{0,0,0}` nếu không rõ) |
| `isDeceased` | Tổ tiên đã mất chưa |
| `ancestorSex` | Giới tính tổ tiên |

**Trả về:** Địa chỉ contract `FamilyNFT` vừa tạo.

**Ví dụ:**
```javascript
const tx = await genealogy.createClan(
    "Họ Nguyễn Bình Dương",
    "Dòng họ Nguyễn tại Bình Dương từ thế kỷ 19",
    "Nguyễn Văn Tổ",
    "Người khai hoang lập ấp",
    { day: 0, month: 0, year: 1820 },   // chỉ biết năm sinh
    { day: 15, month: 3, year: 1895 },  // ngày mất
    true,                                // đã mất
    0                                    // MALE
);
const clanAddress = await tx.wait().then(r => r.events[0].args.clanAddress);
```

---

### 5.2 Đăng ký gia phả có sẵn

```solidity
function addClan(address clanAddress) external
```

Đăng ký một `FamilyNFT` đã được deploy sẵn (ngoài hệ thống). Caller phải là owner của ancestor token trong contract đó.

---

### 5.3 Xoá gia phả khỏi registry

```solidity
function removeClan(address clanAddress) external
```

Chỉ người đã đăng ký clan mới có thể xoá. **Lưu ý:** Contract `FamilyNFT` vẫn tồn tại on-chain, chỉ xoá khỏi danh sách registry.

---

### 5.4 Cập nhật quyền sở hữu khi chuyển ancestor token

```solidity
function claimClanRegistration(address clanAddress) external
```

Khi ancestor token (Token ID = 1) bị chuyển nhượng cho người mới, người mới cần gọi hàm này để cập nhật quyền registry. Sau đó mới có thể dùng `proposeClanLink`, `removeClanLink`, `removeClan`.

---

### 5.5 Quản trị clan (chỉ Registry Owner)

```solidity
function pauseClan(address clanAddress) external     // Tạm dừng clan
function unpauseClan(address clanAddress) external   // Mở lại clan
```

Registry owner có thể tạm dừng khẩn cấp bất kỳ clan nào đang đăng ký.

---

### 5.6 Liên kết gia phả chung gốc tổ

**Đề xuất liên kết:**
```solidity
function proposeClanLink(address myClan, address targetClan) external
```

**Quy trình hai bước — cả hai bên phải đồng ý:**
```
Clan A gọi proposeClanLink(A, B)  →  event ClanLinkProposed
Clan B gọi proposeClanLink(B, A)  →  tự động kích hoạt  →  event ClanLinked
```

**Rút đề xuất:**
```solidity
function withdrawClanLinkProposal(address myClan, address targetClan) external
```

**Xoá liên kết đang hoạt động:**
```solidity
function removeClanLink(address myClan, address otherClan) external
```

**Kiểm tra trạng thái:**
```solidity
function areClansLinked(address clan1, address clan2) external view returns (bool)
function isClanLinkProposed(address proposingClan, address targetClan) external view returns (bool)
function getLinkedClans(address clanAddress) external view returns (address[] memory)
```

---

### 5.7 Tra cứu danh sách clan

```solidity
function getClan(uint256 index) external view returns (address)   // index 1-based
function getClanOwner(address clanAddress) external view returns (address)
function isClanRegistered(address clanAddress) external view returns (bool)
uint256 public clanCount   // Tổng số clan đang đăng ký
```

**Liệt kê toàn bộ clan:**
```javascript
const count = await genealogy.clanCount();
for (let i = 1; i <= count; i++) {
    const addr = await genealogy.getClan(i);
    console.log(addr);
}
```

---

## 6. FamilyNFT — Hướng dẫn sử dụng

> Tất cả thao tác ghi dữ liệu đều yêu cầu contract không bị pause.

### 6.1 Xem thông tin thành viên

```solidity
function getPersonInfo(bytes32 personId) external view returns (FamilyTypes.Person memory)
function personExists(bytes32 personId) external view returns (bool)
function getPersonOrigin(bytes32 personId) external view returns (FamilyTypes.ExternalRef memory)
function getEquivalents(bytes32 personId) external view returns (FamilyTypes.ExternalRef[] memory)
uint256 public personCount   // Tổng số người đã tạo
```

**Ví dụ đọc thông tin:**
```javascript
const ANCESTOR_TOKEN_ID = "0x0000000000000000000000000000000000000000000000000000000000000001";
const person = await familyNFT.getPersonInfo(ANCESTOR_TOKEN_ID);

console.log(person.name);              // Họ tên
console.log(person.isDeceased);        // Đã mất chưa
console.log(person.birthDate.year);   // Năm sinh
console.log(person.children.length);   // Số con
```

---

### 6.2 Thêm con

```solidity
function addChild(
    bytes32 parentId,
    string memory childName,
    string memory shortDesc,
    FamilyTypes.Sex sex,
    FamilyTypes.DateInfo memory birthDate,
    FamilyTypes.DateInfo memory deathDate,
    bool isDeceased
) external
```

Tạo token mới và liên kết ngay với cha/mẹ. Caller phải là owner của `parentId` hoặc ancestor admin.

**Ví dụ:**
```javascript
await familyNFT.addChild(
    ANCESTOR_TOKEN_ID,
    "Nguyễn Văn Con",
    "Con trai trưởng",
    0,                                   // MALE
    { day: 10, month: 5, year: 1855 },  // ngày sinh
    { day: 0, month: 0, year: 0 },      // chưa mất
    false
);
```

---

### 6.3 Xoá con khỏi danh sách cha/mẹ

```solidity
function removeChild(bytes32 childId) external
```

Xoá liên kết cha/mẹ — con. Token của con vẫn tồn tại, chỉ bỏ `parentId`.

---

### 6.4 Thêm vợ/chồng mới (tạo người mới trong cùng gia phả)

```solidity
function addSpouse(
    bytes32 personId,
    string memory name,
    string memory shortDesc,
    FamilyTypes.Sex sex,
    FamilyTypes.DateInfo memory birthDate,
    FamilyTypes.DateInfo memory deathDate,
    bool isDeceased
) external
```

Tạo token mới và thiết lập quan hệ vợ/chồng song chiều. Caller phải có quyền với `personId`.

---

### 6.5 Liên kết hai người trong cùng gia phả thành vợ/chồng

```solidity
function linkSpouses(bytes32 personId1, bytes32 personId2) external
```

Dùng khi cả hai người **đã tồn tại** trong cùng gia phả và muốn thiết lập quan hệ hôn nhân.

---

### 6.6 Xoá quan hệ vợ/chồng

```solidity
function removeSpouse(bytes32 personId, bytes32 spouseId) external
```

---

### 6.7 Cập nhật thông tin thành viên

```solidity
function updatePersonData(
    bytes32 personId,
    string memory newName,
    string memory newShortDesc,
    FamilyTypes.DateInfo memory birthDate,
    FamilyTypes.DateInfo memory deathDate,
    bool isDeceased
) external
```

Caller phải là owner của `personId` hoặc ancestor admin. `newName` không được rỗng.

**Ví dụ — cập nhật khi thành viên qua đời:**
```javascript
await familyNFT.updatePersonData(
    personId,
    "Nguyễn Văn Con",
    "Con trai trưởng, mất năm 1920",
    { day: 10, month: 5, year: 1855 },
    { day: 3, month: 11, year: 1920 },  // ngày mất
    true                                  // isDeceased = true
);
```

---

### 6.8 Ghi metadata tùy chỉnh (LSP8)

```solidity
function setDataForTokenId(
    bytes32 tokenId,
    bytes32 dataKey,
    bytes memory dataValue
) external
```

Lưu trữ dữ liệu bổ sung (ảnh, tài liệu, v.v.) theo chuẩn LSP8 ERC725Y.

---

### 6.9 Quản trị dòng họ

**Cập nhật mô tả gia phả:**
```solidity
function setClanShortDesc(string memory newClanShortDesc) external
```

**Tạm dừng / Mở lại (chỉ ancestor token owner):**
```solidity
function pause() external
function unpause() external
```

---

## 7. Liên kết xuyên gia phả

### Tình huống 1 — Vợ/chồng từ gia phả khác (chỉ liên kết, không tạo bản sao)

```solidity
function addExternalSpouse(
    bytes32 personId,
    address clanAddress,
    bytes32 externalPersonId
) external

function removeExternalSpouse(
    bytes32 personId,
    address clanAddress,
    bytes32 externalPersonId
) external
```

Dùng khi người vợ/chồng đã có token trong một `FamilyNFT` khác và bạn chỉ muốn ghi nhận quan hệ mà **không tạo bản sao**.

**Ví dụ:**
```javascript
// Anh A (trong Clan Nguyễn) lấy chị B (trong Clan Trần)
await clanNguyen.addExternalSpouse(
    personIdAnhA,
    clanTranAddress,
    personIdChiB
);
// Tương tự, Clan Trần có thể gọi ngược lại để liên kết song chiều
await clanTran.addExternalSpouse(
    personIdChiB,
    clanNguyenAddress,
    personIdAnhA
);
```

---

### Tình huống 2 — Nhập thành viên từ gia phả khác (thành viên đầy đủ)

```solidity
function importPerson(
    string memory name,
    string memory shortDesc,
    FamilyTypes.Sex sex,
    FamilyTypes.DateInfo memory birthDate,
    FamilyTypes.DateInfo memory deathDate,
    bool isDeceased,
    address srcClanAddress,
    bytes32 srcPersonId
) external returns (bytes32 newPersonId)
```

Tạo token mới trong gia phả hiện tại cho người này, lưu nguồn gốc để truy vết. Token mới hoạt động đầy đủ (có thể thêm con, cập nhật...).

**Chỉ ancestor admin mới có quyền import.**

**Ví dụ — Chị Trần B về nhà chồng (Họ Nguyễn):**
```javascript
const newPersonId = await clanNguyen.importPerson(
    "Trần Thị B",
    "Dâu trưởng, con gái của ông Trần Văn X",
    1,                                   // FEMALE
    { day: 5, month: 8, year: 1860 },
    { day: 0, month: 0, year: 0 },
    false,
    clanTranAddress,
    personIdChiBInClanTran
);

// Kiểm tra nguồn gốc
const origin = await clanNguyen.getPersonOrigin(newPersonId);
// origin.contractAddress === clanTranAddress
// origin.tokenId === personIdChiBInClanTran
```

> **Lưu ý:** Hai bản ghi (bên Họ Trần và bên Họ Nguyễn) hoàn toàn độc lập, không đồng bộ tự động.

---

### Tình huống 3a — Cùng một người thực xuất hiện trong hai gia phả

```solidity
function linkSamePerson(
    bytes32 localPersonId,
    address otherClanAddress,
    bytes32 otherPersonId
) external

function unlinkSamePerson(
    bytes32 localPersonId,
    address otherClanAddress,
    bytes32 otherPersonId
) external

function getEquivalents(bytes32 personId) external view returns (FamilyTypes.ExternalRef[] memory)
```

Khi hai gia phả ghi chép cùng một người thực nhưng trong hai bản riêng, dùng hàm này để đánh dấu sự tương đồng.

---

### Tình huống 3b — Hai gia phả phát hiện chung gốc tổ

Thực hiện tại **Genealogy Registry**, không phải FamilyNFT (xem [Mục 5.6](#56-liên-kết-gia-phả-chung-gốc-tổ)).

---

## 8. Events

### Genealogy Events

| Event | Khi nào phát sinh |
|-------|-------------------|
| `ClanCreated(creator, clanAddress)` | Tạo clan mới qua `createClan` |
| `ClanAdded(caller, clanAddress)` | Đăng ký clan có sẵn qua `addClan` |
| `ClanRemoved(caller, clanAddress)` | Xoá clan khỏi registry |
| `ClanPaused(caller, clanAddress)` | Registry owner pause một clan |
| `ClanUnpaused(caller, clanAddress)` | Registry owner unpause một clan |
| `ClanLinkProposed(proposingClan, targetClan)` | Một bên đề xuất liên kết |
| `ClanLinkProposalWithdrawn(proposingClan, targetClan)` | Rút đề xuất |
| `ClanLinked(clan1, clan2)` | Liên kết song chiều được kích hoạt |
| `ClanLinkRemoved(clan1, clan2)` | Liên kết bị xoá |

### FamilyNFT Events

| Event | Khi nào phát sinh |
|-------|-------------------|
| `PersonCreated(personId, owner)` | Tạo thành viên mới |
| `UpdatePersonData(sender, personId)` | Cập nhật thông tin thành viên |
| `ChildAdded(sender, parentId, childId)` | Thêm con |
| `ChildRemoved(sender, childId)` | Xoá con |
| `SpouseAdded(sender, personId, spouseId)` | Thêm vợ/chồng cùng clan |
| `SpouseRemoved(sender, personId, spouseId)` | Xoá vợ/chồng cùng clan |
| `ExternalSpouseAdded(sender, personId, clanAddress, externalPersonId)` | Thêm vợ/chồng xuyên clan |
| `ExternalSpouseRemoved(sender, personId, clanAddress, externalPersonId)` | Xoá vợ/chồng xuyên clan |
| `PersonImported(sender, newPersonId, srcClanAddress, srcPersonId)` | Nhập thành viên từ gia phả khác |
| `SamePersonLinked(sender, localPersonId, otherClanAddress, otherPersonId)` | Đánh dấu cùng người thực |
| `SamePersonUnlinked(sender, localPersonId, otherClanAddress, otherPersonId)` | Xoá đánh dấu |
| `ClanShortDescChanged(owner)` | Cập nhật mô tả gia phả |

---

## 9. Phân quyền

### Genealogy Registry

| Hành động | Ai được phép |
|-----------|--------------|
| `pause()` / `unpause()` registry | Registry owner (`Ownable`) |
| `createClan` | Bất kỳ ai |
| `addClan` | Ancestor token owner của clan đó |
| `removeClan` | Người đã đăng ký clan (`_clanOwner`) |
| `claimClanRegistration` | Ancestor token owner hiện tại |
| `pauseClan` / `unpauseClan` | Registry owner |
| `proposeClanLink` / `removeClanLink` | Người đã đăng ký clan (`_clanOwner`) |

### FamilyNFT

| Hành động | Ai được phép |
|-----------|--------------|
| `pause()` / `unpause()` clan | Ancestor token owner |
| `pauseByRegistry` / `unpauseByRegistry` | Genealogy contract (registry) |
| `setClanShortDesc` | Ancestor token owner |
| `addChild`, `addSpouse`, `linkSpouses` | Token owner hoặc ancestor admin |
| `removeChild`, `removeSpouse` | Token owner hoặc ancestor admin |
| `updatePersonData` | Token owner hoặc ancestor admin |
| `setDataForTokenId` | Token owner hoặc ancestor admin |
| `addExternalSpouse`, `removeExternalSpouse` | Token owner hoặc ancestor admin |
| `importPerson` | **Chỉ ancestor admin** |
| `linkSamePerson`, `unlinkSamePerson` | Token owner hoặc ancestor admin |

> **Ancestor admin** = người đang giữ Token ID `0x000...001` (ANCESTOR_TOKEN_ID).

---

## 10. Lưu ý bảo mật

### Quy tắc dữ liệu quan trọng

1. **`isDeceased` và `deathDate` phải nhất quán:** Nếu nhập `deathDate` khác `{0,0,0}`, bắt buộc `isDeceased = true`. Contract sẽ revert nếu vi phạm.

2. **Không đồng bộ xuyên clan:** Khi dùng `importPerson` hoặc `addExternalSpouse`, hai bản ghi ở hai gia phả hoàn toàn độc lập. Cần thủ công cập nhật cả hai phía nếu có thay đổi.

3. **`removeClan` không xoá dữ liệu on-chain:** Contract `FamilyNFT` vẫn tồn tại và đọc được sau khi bị xoá khỏi registry.

### Quyền admin

4. **Ancestor token = quyền admin tuyệt đối:** Ai giữ Token ID 1 có thể sửa thông tin bất kỳ thành viên nào. Cần bảo vệ private key của ví này.

5. **Sau khi chuyển ancestor token:** Gọi ngay `claimClanRegistration(clanAddress)` để cập nhật quyền registry về tay người mới.

6. **Registry owner có quyền pause mọi clan:** Nên dùng multisig hoặc timelock cho registry owner trong môi trường production.

### Tương tác xuyên clan

7. **Validate địa chỉ external clan:** Khi gọi `addExternalSpouse`, `importPerson`, `linkSamePerson` — contract sẽ gọi `personExists()` sang clan kia. Đảm bảo địa chỉ clan kia là hợp lệ, tránh truyền vào contract độc hại.

---

## 11. Luồng nghiệp vụ phổ biến

### A. Khởi tạo hệ thống (lần đầu)

```
1. Deploy FamilyNFT (implementation)
2. Deploy Genealogy(implementationAddress)
3. Gọi Genealogy.createClan(...) để tạo gia phả đầu tiên
   → Nhận lại clanAddress (FamilyNFT clone)
```

### B. Thêm thành viên vào gia phả

```
1. Thêm con của tổ tiên:
   FamilyNFT.addChild(ANCESTOR_TOKEN_ID, ...)

2. Thêm vợ/chồng cho con vừa thêm:
   FamilyNFT.addSpouse(childId, ...)

3. Thêm cháu (con của con):
   FamilyNFT.addChild(childId, ...)
```

### C. Ghi nhận dâu/rể từ dòng họ khác

**Trường hợp dâu/rể chưa có trong hệ thống:**
```
FamilyNFT(clanA).addSpouse(personId, tenDauRe, ...)
→ Tạo token mới trong Clan A cho dâu/rể
```

**Trường hợp dâu/rể đã có token trong Clan B:**
```
Cách 1 — Chỉ liên kết (không tạo bản sao):
  FamilyNFT(clanA).addExternalSpouse(personA, clanB, personB)

Cách 2 — Nhập vào Clan A (thành viên đầy đủ):
  FamilyNFT(clanA).importPerson("Tên", ..., clanB, personB)
  FamilyNFT(clanA).linkSpouses(personA, importedPersonId)
```

### D. Liên kết hai gia phả chung gốc tổ

```
1. Clan A đề xuất:
   Genealogy.proposeClanLink(clanA, clanB)
   → event ClanLinkProposed

2. Clan B đồng ý:
   Genealogy.proposeClanLink(clanB, clanA)
   → event ClanLinked (tự động khi cả hai đã đề xuất)

3. Kiểm tra:
   Genealogy.areClansLinked(clanA, clanB) → true
   Genealogy.getLinkedClans(clanA) → [clanB, ...]
```

### E. Khi ancestor token được chuyển nhượng

```
1. Chuyển token (qua LSP8 transfer):
   FamilyNFT.transfer(oldOwner, newOwner, ANCESTOR_TOKEN_ID, ...)

2. Người mới cập nhật quyền registry:
   Genealogy.claimClanRegistration(clanAddress)

3. Từ lúc này, người mới có thể:
   - removeClan, proposeClanLink, removeClanLink
   - pause/unpause, setClanShortDesc, thêm/sửa thành viên
```

---

---

*Phiên bản hợp đồng: Sau refactor kiến trúc Clone factory + cross-clan links.*
*Deploy mainnet: 2026-05-23. Genealogy: `0x0369579Fcb566C521Ca2b2807ce39bde76CeC518` — LUKSO Mainnet (Chain 42).*
*Mọi thay đổi hợp đồng cần cập nhật tài liệu tương ứng.*
