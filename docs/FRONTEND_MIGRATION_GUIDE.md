# Frontend Migration Guide — Cập nhật Smart Contract

> Tài liệu này liệt kê **toàn bộ thay đổi** so với phiên bản contract cũ.
> Frontend team cần rà soát từng mục và cập nhật code tương ứng.

---

## Mục lục

0. [Thông tin Production — Địa chỉ & Kết nối](#0-thông-tin-production)
1. [Thay đổi triển khai (Deployment)](#1-thay-đổi-triển-khai)
2. [Breaking Changes — Phải sửa ngay](#2-breaking-changes--phải-sửa-ngay)
3. [Kiểu dữ liệu thay đổi](#3-kiểu-dữ-liệu-thay-đổi)
4. [Events thay đổi](#4-events-thay-đổi)
5. [Hàm mới — Tính năng mới](#5-hàm-mới--tính-năng-mới)
6. [Hành vi thay đổi (không phải lỗi compile)](#6-hành-vi-thay-đổi)
7. [Checklist cập nhật](#7-checklist-cập-nhật)

---

## 0. Thông tin Production

### Địa chỉ Contract trên LUKSO Mainnet

| Contract | Địa chỉ |
|----------|---------|
| **Genealogy** (registry — gọi từ frontend) | `0x0369579Fcb566C521Ca2b2807ce39bde76CeC518` |
| **FamilyNFT** (implementation — không gọi trực tiếp) | `0x4483CC54F38f2E16c466c5Db6E525D93aF2eAf4a` |

> `FamilyNFT implementation` chỉ là template nội bộ. Mỗi gia phả là một **clone** có địa chỉ riêng — lấy qua `Genealogy.getClan(index)` hoặc event `ClanCreated`.

### Cấu hình mạng

```javascript
const LUKSO_MAINNET = {
  chainId: 42,
  chainName: "LUKSO Mainnet",
  rpcUrls: ["https://rpc.mainnet.lukso.network"],
  nativeCurrency: { name: "LYX", symbol: "LYX", decimals: 18 },
  blockExplorerUrls: ["https://explorer.execution.mainnet.lukso.network"],
};

const GENEALOGY_ADDRESS = "0x0369579Fcb566C521Ca2b2807ce39bde76CeC518";
```

### Khởi tạo Contract (ethers.js v6)

```javascript
import { ethers } from "ethers";
import GenealogyABI from "./abi/Genealogy.json";
import FamilyNFTABI from "./abi/FamilyNFT.json";

// ── Đọc dữ liệu (không cần ví) ──────────────────────────────────
const provider  = new ethers.JsonRpcProvider("https://rpc.mainnet.lukso.network");
const genealogy = new ethers.Contract(GENEALOGY_ADDRESS, GenealogyABI, provider);

// ── Ghi dữ liệu (cần ví người dùng — LUKSO Universal Profile Extension) ──
const browserProvider  = new ethers.BrowserProvider(window.lukso);
const signer           = await browserProvider.getSigner();
const genealogySigner  = new ethers.Contract(GENEALOGY_ADDRESS, GenealogyABI, signer);

// ── Tương tác với clan cụ thể (FamilyNFT clone) ─────────────────
const clanAddress = await genealogy.getClan(1);                      // hoặc từ event ClanCreated
const familyNFT   = new ethers.Contract(clanAddress, FamilyNFTABI, signer);
```

### Kiểm tra kết nối đúng mạng

```javascript
async function ensureLuksoMainnet() {
  const network = await browserProvider.getNetwork();
  if (network.chainId !== 42n) {
    await browserProvider.send("wallet_switchEthereumChain", [
      { chainId: "0x2a" }  // 42 = 0x2a
    ]);
  }
}
```

### Lấy ABI

Copy hai file từ thư mục `artifacts/` của dự án contract về `abi/` trong dự án frontend:

```
artifacts/contracts/genealogy.sol/Genealogy.json  →  src/abi/Genealogy.json
artifacts/contracts/familyNFT.sol/FamilyNFT.json  →  src/abi/FamilyNFT.json
```

Chỉ cần dùng field `"abi"` bên trong file JSON, hoặc import cả file và truy cập `.abi`.

### Lắng nghe event `ClanCreated` để lấy địa chỉ clan mới

```javascript
// Sau khi gọi createClan, lấy địa chỉ clan từ event
const tx      = await genealogySigner.createClan(...);
const receipt = await tx.wait();
const event   = receipt.logs
  .map(log => { try { return genealogy.interface.parseLog(log); } catch { return null; } })
  .find(e => e?.name === "ClanCreated");
const newClanAddress = event.args.clanAddress;
```

---

## 1. Thay đổi triển khai

### Trước
```
Deploy Genealogy()  →  Genealogy.createClan(...)  →  tạo FamilyNFT đầy đủ
```

### Sau — Phải deploy theo đúng thứ tự
```
1. Deploy FamilyNFT()          →  lưu IMPLEMENTATION_ADDRESS
2. Deploy Genealogy(IMPLEMENTATION_ADDRESS)
3. Genealogy.createClan(...)   →  tạo FamilyNFT clone (rẻ hơn ~10x gas)
```

> **Action:** Cập nhật deployment script. Lưu và cấu hình `IMPLEMENTATION_ADDRESS` trước khi deploy Genealogy.

---

## 2. Breaking Changes — Phải sửa ngay

Những thay đổi dưới đây sẽ gây **lỗi compile** hoặc **transaction revert** nếu không cập nhật.

---

### 2.1 `Genealogy.createClan` — Thêm 2 tham số mới

| | Cũ | Mới |
|--|----|----|
| **Signature** | `createClan(clanName, clanShortDesc, ancestorName, ancestorShortDesc, birthDate, deathDate)` | `createClan(clanName, clanShortDesc, ancestorName, ancestorShortDesc, birthDate, deathDate, isDeceased, ancestorSex)` |
| **Tham số thêm** | — | `bool isDeceased`, `uint8 ancestorSex` |

```javascript
// CŨ
await genealogy.createClan(
    "Họ Nguyễn", "Mô tả",
    "Nguyễn Văn Tổ", "Mô tả tổ",
    { day: 0, month: 0, year: 1800 },
    { day: 0, month: 0, year: 0 }
);

// MỚI
await genealogy.createClan(
    "Họ Nguyễn", "Mô tả",
    "Nguyễn Văn Tổ", "Mô tả tổ",
    { day: 0, month: 0, year: 1800 },
    { day: 0, month: 0, year: 1890 },
    true,   // isDeceased
    0        // ancestorSex: 0=MALE, 1=FEMALE, 2=UNDEFINED
);
```

---

### 2.2 `FamilyNFT.addSpouse` — Thêm `sex` và `isDeceased`

| | Cũ | Mới |
|--|----|----|
| **Signature** | `addSpouse(personId, name, shortDesc, birthDate, deathDate)` | `addSpouse(personId, name, shortDesc, sex, birthDate, deathDate, isDeceased)` |
| **sex** | Tự suy ngược từ người kia | Caller tự truyền vào |
| **isDeceased** | Không có | Bắt buộc truyền |

```javascript
// CŨ
await familyNFT.addSpouse(personId, "Trần Thị A", "Mô tả",
    { day: 1, month: 1, year: 1860 },
    { day: 0, month: 0, year: 0 }
);

// MỚI
await familyNFT.addSpouse(personId, "Trần Thị A", "Mô tả",
    1,  // sex: FEMALE
    { day: 1, month: 1, year: 1860 },
    { day: 0, month: 0, year: 0 },
    false  // isDeceased
);
```

---

### 2.3 `FamilyNFT.addChild` — Thêm `isDeceased`

| | Cũ | Mới |
|--|----|----|
| **Signature** | `addChild(parentId, childName, shortDesc, sex, birthDate, deathDate)` | `addChild(parentId, childName, shortDesc, sex, birthDate, deathDate, isDeceased)` |

```javascript
// CŨ
await familyNFT.addChild(parentId, "Nguyễn Văn B", "Mô tả", 0,
    { day: 5, month: 3, year: 1880 },
    { day: 0, month: 0, year: 0 }
);

// MỚI
await familyNFT.addChild(parentId, "Nguyễn Văn B", "Mô tả", 0,
    { day: 5, month: 3, year: 1880 },
    { day: 0, month: 0, year: 0 },
    false  // isDeceased
);
```

---

### 2.4 `FamilyNFT.updatePersonData` — Thêm `isDeceased`

| | Cũ | Mới |
|--|----|----|
| **Signature** | `updatePersonData(personId, newName, newShortDesc, birthDate, deathDate)` | `updatePersonData(personId, newName, newShortDesc, birthDate, deathDate, isDeceased)` |

```javascript
// CŨ
await familyNFT.updatePersonData(personId, "Tên mới", "Mô tả mới",
    { day: 1, month: 1, year: 1850 },
    { day: 10, month: 5, year: 1920 }
);

// MỚI — LƯU Ý: nếu có deathDate thì isDeceased PHẢI là true
await familyNFT.updatePersonData(personId, "Tên mới", "Mô tả mới",
    { day: 1, month: 1, year: 1850 },
    { day: 10, month: 5, year: 1920 },
    true  // isDeceased — bắt buộc true khi có deathDate
);
```

> **Quy tắc mới:** Nếu `deathDate != {0,0,0}` mà `isDeceased = false` → transaction revert.
> Frontend cần tự động set `isDeceased = true` khi user nhập ngày mất.

---

### 2.5 `FamilyNFT.setClanShortDesc` — Thay đổi phân quyền

| | Cũ | Mới |
|--|----|----|
| **Quyền** | `onlyOwner` (owner của contract) | Ancestor token owner (người giữ Token ID 1) |

Nếu frontend đang dùng `owner()` để kiểm tra quyền trước khi gọi `setClanShortDesc` — phải đổi thành kiểm tra `tokenOwnerOf(ANCESTOR_TOKEN_ID)`.

---

### 2.6 `FamilyNFT.getPersonInfo` — Struct `Person` có thêm trường

Struct `Person` trả về từ `getPersonInfo` bây giờ có thêm:
- `bool isDeceased`
- `ExternalRef[] externalSpouses`

Code đang destructure hoặc map struct này cần cập nhật để không bị lỗi index.

```javascript
// CŨ — Person struct
const { name, parentId, children, spouses, sex, birthDate, deathDate, shortDesc, createdAt } = person;

// MỚI — Person struct (thêm isDeceased và externalSpouses)
const { name, parentId, children, spouses, externalSpouses, sex,
        birthDate, deathDate, isDeceased, shortDesc, createdAt } = person;
```

---

### 2.7 `FamilyTypes.Sex` — Đổi tên enum value

| | Cũ | Mới |
|--|----|----|
| Giá trị 2 | `UNDEFINE` | `UNDEFINED` |
| Số nguyên | `2` | `2` (không đổi) |

Nếu frontend so sánh bằng tên string (`"UNDEFINE"`), cần đổi thành `"UNDEFINED"`.
Nếu so sánh bằng số (`2`), không cần thay đổi.

---

### 2.8 `FamilyNFT` không còn dùng `Counters.Counter`

| | Cũ | Mới |
|--|----|----|
| `personCount` type | `Counters.Counter` (struct) | `uint256` |
| Đọc giá trị | `personCount.current()` | `personCount` trực tiếp |

```javascript
// CŨ
const count = await familyNFT.personCount(); // trả về struct, cần .current()

// MỚI
const count = await familyNFT.personCount(); // trả về uint256 trực tiếp
```

---

## 3. Kiểu dữ liệu thay đổi

### 3.1 `FamilyTypes.Person` — Struct đầy đủ mới

```solidity
// MỚI
struct Person {
    string         name;
    bytes32        parentId;
    bytes32[]      children;
    bytes32[]      spouses;
    ExternalRef[]  externalSpouses;  // THÊM MỚI
    Sex            sex;
    DateInfo       birthDate;
    DateInfo       deathDate;
    bool           isDeceased;       // THÊM MỚI
    string         shortDesc;
    uint256        createdAt;
}
```

### 3.2 `FamilyTypes.ExternalRef` — Struct mới hoàn toàn

```solidity
// MỚI
struct ExternalRef {
    address contractAddress;  // Địa chỉ FamilyNFT của gia phả khác
    bytes32 tokenId;          // Token ID người đó trong gia phả kia
}
```

Dùng trong: `externalSpouses[]`, `getPersonOrigin()`, `getEquivalents()`.

---

## 4. Events thay đổi

### 4.1 Events cũ — Đã thay đổi indexed fields

| Event | Cũ | Mới |
|-------|----|-----|
| `PersonCreated` | `address ownership` (không indexed) | `address indexed ownership` |
| `SpouseAdded` | `address sender` (không indexed) | `address indexed sender` |
| `ChildAdded` | `address sender` (không indexed) | `address indexed sender` |
| `UpdatePersonData` | `address sender` (không indexed) | `address indexed sender` |
| `SpouseRemoved` | `address sender` (không indexed) | `address indexed sender` |
| `ChildRemoved` | `address sender` (không indexed) | `address indexed sender` |

> **Action:** Cập nhật filter event nếu đang filter theo `indexed` fields.

### 4.2 Events FamilyNFT — Mới hoàn toàn

```
ExternalSpouseAdded(address indexed sender, bytes32 indexed personId, address indexed clanAddress, bytes32 externalPersonId)
ExternalSpouseRemoved(address indexed sender, bytes32 indexed personId, address indexed clanAddress, bytes32 externalPersonId)
PersonImported(address indexed sender, bytes32 indexed newPersonId, address indexed srcClanAddress, bytes32 srcPersonId)
SamePersonLinked(address indexed sender, bytes32 indexed localPersonId, address indexed otherClanAddress, bytes32 otherPersonId)
SamePersonUnlinked(address indexed sender, bytes32 indexed localPersonId, address indexed otherClanAddress, bytes32 otherPersonId)
```

### 4.3 Events Genealogy — Mới hoàn toàn

```
ClanPaused(address indexed callerAddress, address indexed clanAddress)
ClanUnpaused(address indexed callerAddress, address indexed clanAddress)
ClanLinkProposed(address indexed proposingClan, address indexed targetClan)
ClanLinkProposalWithdrawn(address indexed proposingClan, address indexed targetClan)
ClanLinked(address indexed clan1, address indexed clan2)
ClanLinkRemoved(address indexed clan1, address indexed clan2)
```

---

## 5. Hàm mới — Tính năng mới

### 5.1 FamilyNFT — Hàm mới

#### `linkSpouses(personId1, personId2)` — Liên kết hai người đã có trong cùng gia phả
```javascript
await familyNFT.linkSpouses(personId1, personId2);
// Dùng khi: cả hai đã tồn tại và muốn thiết lập quan hệ hôn nhân
```

#### `addExternalSpouse(personId, clanAddress, externalPersonId)` — Vợ/chồng từ gia phả khác
```javascript
await familyNFT.addExternalSpouse(
    personId,
    "0xDiaChiClanKhac",
    externalPersonId
);
```

#### `removeExternalSpouse(personId, clanAddress, externalPersonId)` — Xoá liên kết xuyên clan
```javascript
await familyNFT.removeExternalSpouse(personId, clanAddress, externalPersonId);
```

#### `importPerson(name, shortDesc, sex, birthDate, deathDate, isDeceased, srcClanAddress, srcPersonId)` — Nhập thành viên từ gia phả khác
```javascript
const newPersonId = await familyNFT.importPerson(
    "Trần Thị B", "Mô tả",
    1,  // FEMALE
    { day: 0, month: 0, year: 1860 },
    { day: 0, month: 0, year: 0 },
    false,
    srcClanAddress,
    srcPersonId
);
// Chỉ ancestor admin mới gọi được
```

#### `linkSamePerson(localPersonId, otherClanAddress, otherPersonId)` — Đánh dấu cùng người thực
```javascript
await familyNFT.linkSamePerson(localId, otherClanAddress, otherId);
```

#### `unlinkSamePerson(localPersonId, otherClanAddress, otherPersonId)` — Xoá đánh dấu
```javascript
await familyNFT.unlinkSamePerson(localId, otherClanAddress, otherId);
```

#### `personExists(personId)` — Kiểm tra token tồn tại
```javascript
const exists = await familyNFT.personExists(personId); // returns bool
```

#### `getPersonOrigin(personId)` — Lấy nguồn gốc (nếu được import)
```javascript
const origin = await familyNFT.getPersonOrigin(personId);
// origin.contractAddress === address(0)  → người tạo tại chỗ
// origin.contractAddress !== address(0)  → được import từ clan kia
```

#### `getEquivalents(personId)` — Danh sách bản ghi tương đương ở clan khác
```javascript
const refs = await familyNFT.getEquivalents(personId);
// refs: ExternalRef[]  →  [{ contractAddress, tokenId }, ...]
```

---

### 5.2 FamilyNFT — Quản trị mới

#### `pause()` / `unpause()` — Tạm dừng/mở clan
```javascript
// Chỉ ancestor token owner gọi được
await familyNFT.pause();
await familyNFT.unpause();
```

---

### 5.3 Genealogy — Hàm mới

#### `claimClanRegistration(clanAddress)` — Cập nhật quyền sau khi transfer ancestor token
```javascript
// Gọi ngay sau khi nhận ancestor token từ người khác
await genealogy.claimClanRegistration(clanAddress);
```

#### `pauseClan(clanAddress)` / `unpauseClan(clanAddress)` — Registry pause clan
```javascript
// Chỉ registry owner gọi được
await genealogy.pauseClan(clanAddress);
await genealogy.unpauseClan(clanAddress);
```

#### `getClan(index)` — Lấy địa chỉ clan theo index (1-based)
```javascript
const count = await genealogy.clanCount();
for (let i = 1; i <= count; i++) {
    const addr = await genealogy.getClan(i);
}
```

#### `isClanRegistered(clanAddress)` — Kiểm tra clan có đăng ký không
```javascript
const ok = await genealogy.isClanRegistered(clanAddress); // bool
```

#### Clan link functions — Liên kết gia phả chung gốc
```javascript
// Bên A đề xuất
await genealogy.proposeClanLink(myClanAddress, targetClanAddress);

// Bên B đồng ý → liên kết tự động kích hoạt
await genealogy.proposeClanLink(bClanAddress, aClanAddress);

// Kiểm tra
await genealogy.areClansLinked(clan1, clan2);          // bool
await genealogy.isClanLinkProposed(clan1, clan2);      // bool
await genealogy.getLinkedClans(clanAddress);           // address[]

// Rút đề xuất / Xoá liên kết
await genealogy.withdrawClanLinkProposal(myClan, targetClan);
await genealogy.removeClanLink(myClan, otherClan);
```

---

## 6. Hành vi thay đổi

### 6.1 `removeSpouse` và `removeChild` — O(n) → O(1)

Cũ dùng vòng lặp linear scan. Mới dùng swap-and-pop với index mapping.
**Không ảnh hưởng frontend** — cùng signature, kết quả giống nhau, chỉ nhanh hơn.

### 6.2 `setDataForTokenId` — Bị chặn khi pause

Trước đây có thể gọi kể cả khi contract bị pause. **Bây giờ sẽ revert** nếu contract đang bị pause.

### 6.3 Validation mới sẽ revert nhiều hơn

Frontend cần validate ở client side trước khi gửi transaction để tránh revert tốn gas:

| Điều kiện | Revert message |
|-----------|----------------|
| `deathDate != {0,0,0}` nhưng `isDeceased = false` | `"Death date set but isDeceased is false"` |
| `clanName` rỗng | `"Clan name cannot be empty"` |
| `ancestorName` rỗng | `"Ancestor name cannot be empty"` |
| `name` rỗng khi thêm người | `"Name cannot be empty"` |
| `month` không trong `[1,12]` | `"Invalid month"` |
| `day` không trong `[1,31]` | `"Invalid day"` |

### 6.4 `FamilyNFT` không còn là contract deploy trực tiếp

`FamilyNFT` giờ là **clone** (proxy). Địa chỉ implementation và địa chỉ clone **khác nhau**.
Nếu frontend hardcode ABI theo địa chỉ implementation, cần đổi sang địa chỉ clone (do `createClan` trả về).

---

## 7. Checklist cập nhật

### Deployment & Kết nối
- [x] **Địa chỉ Genealogy mainnet:** `0x0369579Fcb566C521Ca2b2807ce39bde76CeC518`
- [x] **Địa chỉ FamilyNFT impl mainnet:** `0x4483CC54F38f2E16c466c5Db6E525D93aF2eAf4a`
- [ ] Copy ABI: `artifacts/contracts/genealogy.sol/Genealogy.json` → `src/abi/`
- [ ] Copy ABI: `artifacts/contracts/familyNFT.sol/FamilyNFT.json` → `src/abi/`
- [ ] Cập nhật Chain ID → `42`, RPC → `https://rpc.mainnet.lukso.network`
- [ ] Thêm logic switch network khi user không ở đúng mạng
- [ ] Lấy địa chỉ clan qua `getClan(index)` hoặc event `ClanCreated` (không hardcode)

### Contract calls — Breaking
- [ ] `createClan` — thêm `isDeceased`, `ancestorSex`
- [ ] `addSpouse` — thêm `sex`, `isDeceased`; bỏ logic tự suy giới tính
- [ ] `addChild` — thêm `isDeceased`
- [ ] `updatePersonData` — thêm `isDeceased`
- [ ] `setClanShortDesc` — kiểm tra quyền bằng ancestor token owner thay vì `owner()`
- [ ] `personCount` — đọc trực tiếp, không dùng `.current()`

### Dữ liệu / UI
- [ ] Struct `Person` — thêm fields `isDeceased`, `externalSpouses` vào render
- [ ] `Sex` enum — đổi `UNDEFINE` → `UNDEFINED` nếu dùng string
- [ ] Form nhập liệu — tự động set `isDeceased = true` khi user nhập ngày mất
- [ ] Validate client-side trước khi submit để tránh revert lãng phí gas

### Event listeners
- [ ] Cập nhật indexed fields trong tất cả event filters
- [ ] Đăng ký lắng nghe các events mới nếu cần hiển thị lịch sử

### Tính năng mới (tùy chọn tích hợp)
- [ ] `linkSpouses` — UI liên kết hai người đã có trong clan
- [ ] `addExternalSpouse` / `removeExternalSpouse` — UI vợ/chồng xuyên clan
- [ ] `importPerson` — UI nhập thành viên từ clan khác
- [ ] `linkSamePerson` / `unlinkSamePerson` — UI đánh dấu cùng người thực
- [ ] `personExists`, `getPersonOrigin`, `getEquivalents` — bổ sung vào trang thông tin thành viên
- [ ] `getClan(index)` / `isClanRegistered` — trang danh sách clan
- [ ] `pauseClan` / `unpauseClan` — trang quản trị registry
- [ ] Clan link UI (`proposeClanLink`, `getLinkedClans`, ...) — trang liên kết gia phả
- [ ] `claimClanRegistration` — UI chuyển quyền sở hữu clan

---

*Phiên bản: Sau refactor kiến trúc (Clone factory, cross-clan links, Init pattern).*
*Deploy mainnet: 2026-05-23. Genealogy: `0x0369579Fcb566C521Ca2b2807ce39bde76CeC518` — LUKSO Mainnet (Chain 42).*
*Mọi thắc mắc về contract logic, liên hệ team backend để được giải đáp.*
