// ========================================
// LocalStorage 버전 - Genspark 배포 문제 해결
// RESTful Table API 대신 브라우저 LocalStorage 사용
// ========================================

// ========================================
// 탭 전환 기능
// ========================================
const tabBtns = document.querySelectorAll('.tab-btn');
const calculatorSections = document.querySelectorAll('.calculator-section');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');
        
        // 모든 탭 버튼과 섹션에서 active 클래스 제거
        tabBtns.forEach(b => b.classList.remove('active'));
        calculatorSections.forEach(section => section.classList.remove('active'));
        
        // 클릭된 탭 활성화
        btn.classList.add('active');
        document.getElementById(`${tabName}-calculator`).classList.add('active');
        
        // 배분액 계산기로 전환 시 출금 데이터 로드
        if (tabName === 'distribution') {
            loadWithdrawalData();
        }
    });
});

// ========================================
// LocalStorage 유틸리티 함수
// ========================================
function saveToLocalStorage(tableName, data) {
    try {
        // 기존 데이터 가져오기
        const existing = JSON.parse(localStorage.getItem(tableName) || '[]');
        
        // 새 데이터 추가
        const newData = {
            ...data,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        existing.unshift(newData); // 최신 데이터를 앞에 추가
        
        // 저장 (최대 100개만 유지)
        const limited = existing.slice(0, 100);
        localStorage.setItem(tableName, JSON.stringify(limited));
        
        return newData;
    } catch (error) {
        console.error('LocalStorage 저장 오류:', error);
        return null;
    }
}

function loadFromLocalStorage(tableName, limit = 50) {
    try {
        const data = JSON.parse(localStorage.getItem(tableName) || '[]');
        return data.slice(0, limit);
    } catch (error) {
        console.error('LocalStorage 로드 오류:', error);
        return [];
    }
}

function deleteFromLocalStorage(tableName, id) {
    try {
        const existing = JSON.parse(localStorage.getItem(tableName) || '[]');
        const filtered = existing.filter(item => item.id !== id);
        localStorage.setItem(tableName, JSON.stringify(filtered));
        return true;
    } catch (error) {
        console.error('LocalStorage 삭제 오류:', error);
        return false;
    }
}

// ========================================
// 날짜 포맷팅 함수
// ========================================
function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getDateForReport() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    return `${year}년 ${month}월 ${day}일`;
}

// ========================================
// 숫자 포맷팅 함수들
// ========================================
function formatNumber(num) {
    return num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatWon(num) {
    return Math.round(num).toLocaleString('ko-KR');
}

// ========================================
// 복사 기능
// ========================================
async function copyResult(elementId) {
    const text = document.getElementById(elementId).textContent;
    
    try {
        await navigator.clipboard.writeText(text);
        showCopySuccess();
    } catch (err) {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            showCopySuccess();
        } catch (err2) {
            alert('복사에 실패했습니다. 수동으로 복사해주세요.');
        }
        
        document.body.removeChild(textArea);
    }
}

function showCopySuccess() {
    const copySuccess = document.getElementById('copySuccess');
    copySuccess.style.display = 'flex';
    setTimeout(() => {
        copySuccess.style.display = 'none';
    }, 3000);
}

// ========================================
// 1. XRP 거래 계산기
// ========================================
const xrpForm = document.getElementById('xrpForm');
const balanceInput = document.getElementById('balance');
const xrpSentInput = document.getElementById('xrpSent');
const usdtAfterSaleInput = document.getElementById('usdtAfterSale');
const xrpResult = document.getElementById('xrpResult');
const xrpResultText = document.getElementById('xrpResultText');

xrpForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const balance = parseFloat(balanceInput.value.replace(/,/g, ''));
    const xrpSent = parseFloat(xrpSentInput.value.replace(/,/g, ''));
    const usdtAfterSale = parseFloat(usdtAfterSaleInput.value.replace(/,/g, ''));
    
    if (isNaN(balance) || isNaN(xrpSent) || isNaN(usdtAfterSale)) {
        alert('모든 필드에 올바른 숫자를 입력해주세요.');
        return;
    }
    
    // 계산
    const netXrpSale = usdtAfterSale - balance;
    const profit = netXrpSale * 0.02;
    const futuresTransfer = netXrpSale - profit;
    
    // 날짜 추가
    const reportDate = getDateForReport();
    
    // 결과 생성
    const result = `[작성일: ${reportDate}]

1. 기존바이낸스잔액: ${formatNumber(balance)}
2. xrp 전송: ${formatNumber(xrpSent)}
3. 바이낸스에서 xrp매도후 테더금액: ${formatNumber(usdtAfterSale)}
4. 순xrp매도액: "3-1" = ${formatNumber(netXrpSale)}
5. 2%수익: "4"×2% = ${formatNumber(profit)}
6. 선물사송금액: "4-5" = ${formatNumber(futuresTransfer)}`;
    
    xrpResultText.textContent = result;
    xrpResult.style.display = 'block';
    xrpResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // LocalStorage에 저장
    saveToLocalStorage('xrp_calculations', {
        calculation_date: getCurrentDateTime(),
        balance: balance,
        xrp_sent: xrpSent,
        usdt_after_sale: usdtAfterSale,
        net_xrp_sale: netXrpSale,
        profit_2percent: profit,
        futures_transfer: futuresTransfer
    });
});

// ========================================
// 2. 입금액 계산기
// ========================================
const depositForm = document.getElementById('depositForm');
const depositAmountInput = document.getElementById('depositAmount');
const depositResult = document.getElementById('depositResult');
const depositResultText = document.getElementById('depositResultText');

depositForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const depositAmount = parseFloat(depositAmountInput.value.replace(/,/g, ''));
    
    if (isNaN(depositAmount) || depositAmount <= 0) {
        alert('올바른 금액을 입력해주세요.');
        return;
    }
    
    // 계산
    const onePercent = depositAmount * 0.01;
    const personalCorporate = depositAmount * 0.005;
    const bithumbDeposit = depositAmount - onePercent;
    
    // 날짜 추가
    const reportDate = getDateForReport();
    
    // 결과 생성
    const result = `[작성일: ${reportDate}]

1. 오늘입금액: ${formatWon(depositAmount)}
2. 1%: ${formatWon(onePercent)}
3. 개인 법인(각0.5%씩): ${formatWon(personalCorporate)}
4. 빗썸입금액: "1-2" = ${formatWon(bithumbDeposit)}`;
    
    depositResultText.textContent = result;
    depositResult.style.display = 'block';
    depositResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // LocalStorage에 저장
    saveToLocalStorage('deposit_calculations', {
        calculation_date: getCurrentDateTime(),
        deposit_amount: depositAmount,
        one_percent: onePercent,
        personal_corporate: personalCorporate,
        bithumb_deposit: bithumbDeposit
    });
});

// ========================================
// 3. 출금 계산기
// ========================================
const withdrawalForm = document.getElementById('withdrawalForm');
const withdrawalRequestInput = document.getElementById('withdrawalRequest');
const wonAmountInput = document.getElementById('wonAmount');
const withdrawalResult = document.getElementById('withdrawalResult');
const withdrawalResultText = document.getElementById('withdrawalResultText');

withdrawalForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const withdrawalRequest = parseFloat(withdrawalRequestInput.value.replace(/,/g, ''));
    const wonAmount = parseFloat(wonAmountInput.value.replace(/,/g, ''));
    
    if (isNaN(withdrawalRequest) || isNaN(wonAmount)) {
        alert('모든 필드에 올바른 숫자를 입력해주세요.');
        return;
    }
    
    if (withdrawalRequest <= 0 || wonAmount <= 0) {
        alert('0보다 큰 금액을 입력해주세요.');
        return;
    }
    
    // 계산
    const twoPercent = withdrawalRequest * 0.02;
    const bithumbWithdrawal = withdrawalRequest - twoPercent;
    const onePercent = wonAmount * 0.01;
    const customerWithdrawal = wonAmount - onePercent;
    
    // 날짜 추가
    const reportDate = getDateForReport();
    
    // 결과 생성
    const result = `[작성일: ${reportDate}]

1. 출금요청액: ${formatNumber(withdrawalRequest)}
2. 2%수익: "1"× 2% = ${formatNumber(twoPercent)}
3. 빗썸 출금금액: "1" - "2" = ${formatNumber(bithumbWithdrawal)}
4. 환매후 원화금액: ${formatWon(wonAmount)}
5. 1%수익: "4" × 1% = ${formatWon(onePercent)}
6. 고객 출금금액: "4" - "5" = ${formatWon(customerWithdrawal)}`;
    
    withdrawalResultText.textContent = result;
    withdrawalResult.style.display = 'block';
    withdrawalResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // 로컬 스토리지에 저장 (배분액 계산기 연동용)
    localStorage.setItem('lastWithdrawalCalculation', JSON.stringify({
        withdrawalRequest,
        wonAmount
    }));
    
    // 배분액 계산기 데이터 업데이트
    loadWithdrawalData();
    
    // LocalStorage에 저장
    saveToLocalStorage('withdrawal_calculations', {
        calculation_date: getCurrentDateTime(),
        withdrawal_request: withdrawalRequest,
        two_percent: twoPercent,
        bithumb_withdrawal: bithumbWithdrawal,
        won_amount: wonAmount,
        one_percent: onePercent,
        customer_withdrawal: customerWithdrawal
    });
});

// ========================================
// 4. 배분액 계산기
// ========================================
const distributionForm = document.getElementById('distributionForm');
const customerInputs = [
    document.getElementById('customer1'),
    document.getElementById('customer2'),
    document.getElementById('customer3'),
    document.getElementById('customer4'),
    document.getElementById('customer5')
];
const distributionResult = document.getElementById('distributionResult');
const distributionResultText = document.getElementById('distributionResultText');
const linkedWithdrawalEl = document.getElementById('linkedWithdrawal');
const linkedCustomerEl = document.getElementById('linkedCustomer');

// 출금 계산기 데이터 불러오기
function loadWithdrawalData() {
    const savedData = localStorage.getItem('lastWithdrawalCalculation');
    
    if (savedData) {
        const data = JSON.parse(savedData);
        const withdrawalRequest = parseFloat(data.withdrawalRequest);
        const wonAmount = parseFloat(data.wonAmount);
        
        // 고객 출금금액 (6번) 계산
        const onePercent = wonAmount * 0.01;
        const customerWithdrawal = wonAmount - onePercent;
        
        // 화면에 표시
        linkedWithdrawalEl.textContent = formatNumber(withdrawalRequest);
        linkedCustomerEl.textContent = formatWon(customerWithdrawal);
        
        return { withdrawalRequest, customerWithdrawal };
    } else {
        linkedWithdrawalEl.textContent = '데이터 없음';
        linkedCustomerEl.textContent = '데이터 없음';
        return null;
    }
}

distributionForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // 출금 계산기 데이터 확인
    const withdrawalData = loadWithdrawalData();
    if (!withdrawalData) {
        alert('출금 계산기에서 먼저 계산을 진행해주세요.');
        return;
    }
    
    const { withdrawalRequest, customerWithdrawal } = withdrawalData;
    
    // 고객 데이터 수집
    const customers = [];
    let hasData = false;
    
    customerInputs.forEach((input, index) => {
        const amount = parseFloat(input.value.replace(/,/g, ''));
        if (!isNaN(amount) && amount > 0) {
            hasData = true;
            const result = (amount / withdrawalRequest) * customerWithdrawal;
            customers.push({
                number: index + 1,
                amount: amount,
                result: result
            });
        }
    });
    
    if (!hasData) {
        alert('최소 1개 이상의 고객 금액을 입력해주세요.');
        return;
    }
    
    // 날짜 추가
    const reportDate = getDateForReport();
    
    // 결과 생성
    let result = `[작성일: ${reportDate}]

출금 요청액: ${formatNumber(withdrawalRequest)}
고객 출금금액: ${formatWon(customerWithdrawal)}

`;
    
    customers.forEach(customer => {
        result += `고객${customer.number}: ${formatNumber(customer.amount)} / ${formatNumber(withdrawalRequest)} × ${formatWon(customerWithdrawal)} = ${formatWon(customer.result)}\n`;
    });
    
    distributionResultText.textContent = result;
    distributionResult.style.display = 'block';
    distributionResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // LocalStorage에 저장
    const saveData = {
        calculation_date: getCurrentDateTime(),
        withdrawal_request: withdrawalRequest,
        customer_withdrawal: customerWithdrawal
    };
    
    customers.forEach(customer => {
        saveData[`customer${customer.number}_amount`] = customer.amount;
        saveData[`customer${customer.number}_result`] = customer.result;
    });
    
    saveToLocalStorage('distribution_calculations', saveData);
});

// 페이지 로드 시 출금 데이터 로드
loadWithdrawalData();

// ========================================
// 입력 필드 실시간 콤마 포맷팅
// ========================================
const allInputs = document.querySelectorAll('input[inputmode="decimal"]');

function formatInputWithComma(input) {
    // 현재 커서 위치 저장
    const cursorPos = input.selectionStart;
    const oldValue = input.value;
    
    // 콤마 제거 후 숫자와 소수점만 남김
    let value = input.value.replace(/[^0-9.]/g, '');
    
    // 빈 값이면 그대로 반환
    if (value === '') {
        input.value = '';
        return;
    }
    
    // 소수점이 여러 개 있으면 첫 번째만 유지
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // 소수점 앞부분에 콤마 추가
    const [integerPart, decimalPart] = value.split('.');
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // 최종 값 생성
    const newValue = decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger;
    input.value = newValue;
    
    // 커서 위치 재조정
    const commasBeforeCursor = (oldValue.slice(0, cursorPos).match(/,/g) || []).length;
    const commasBeforeCursorNew = (newValue.slice(0, cursorPos).match(/,/g) || []).length;
    const newCursorPos = cursorPos + (commasBeforeCursorNew - commasBeforeCursor);
    
    input.setSelectionRange(newCursorPos, newCursorPos);
}

allInputs.forEach(input => {
    // 입력 중 실시간 콤마 추가
    input.addEventListener('input', function(e) {
        formatInputWithComma(this);
    });
    
    // 숫자 키패드 표시 (모바일)
    input.setAttribute('pattern', '[0-9,.]*');
});

// ========================================
// 히스토리 조회 기능
// ========================================
let currentHistoryType = 'xrp';

// 히스토리 탭 전환
const historyTabBtns = document.querySelectorAll('.history-tab-btn');
historyTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        historyTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentHistoryType = btn.getAttribute('data-history-tab');
    });
});

// 히스토리 데이터 로드
function loadHistory() {
    const historyContent = document.getElementById('historyContent');
    const selectAllControls = document.getElementById('selectAllControls');
    const deleteBtn = document.getElementById('deleteBtn');
    const copySelectedBtn = document.getElementById('copySelectedBtn');
    
    historyContent.innerHTML = '<p class="info-text"><i class="fas fa-spinner fa-spin"></i> 데이터를 불러오는 중...</p>';
    selectAllControls.style.display = 'none';
    deleteBtn.style.display = 'none';
    copySelectedBtn.style.display = 'none';
    
    let tableName = '';
    switch(currentHistoryType) {
        case 'xrp':
            tableName = 'xrp_calculations';
            break;
        case 'deposit':
            tableName = 'deposit_calculations';
            break;
        case 'withdrawal':
            tableName = 'withdrawal_calculations';
            break;
        case 'distribution':
            tableName = 'distribution_calculations';
            break;
    }
    
    // LocalStorage에서 데이터 로드
    setTimeout(() => {
        const data = loadFromLocalStorage(tableName, 50);
        
        if (data.length === 0) {
            historyContent.innerHTML = '<div class="no-data"><i class="fas fa-inbox"></i><br><br>저장된 데이터가 없습니다.</div>';
            selectAllControls.style.display = 'none';
            return;
        }
        
        let html = '';
        data.forEach(item => {
            html += generateHistoryItem(item, currentHistoryType);
        });
        
        historyContent.innerHTML = html;
        selectAllControls.style.display = 'block';
        
        // 전체 선택 체크박스 초기화
        document.getElementById('selectAllCheckbox').checked = false;
        document.getElementById('selectAllCheckbox').indeterminate = false;
    }, 100);
}

function generateHistoryItem(item, type) {
    const date = new Date(item.calculation_date || item.created_at);
    const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    
    let content = '';
    
    switch(type) {
        case 'xrp':
            content = `
                <div>기존 바이낸스 잔액: ${formatNumber(item.balance)}</div>
                <div>XRP 전송액: ${formatNumber(item.xrp_sent)}</div>
                <div>매도 후 테더금액: ${formatNumber(item.usdt_after_sale)}</div>
                <div>순 XRP 매도액: ${formatNumber(item.net_xrp_sale)}</div>
                <div>2% 수익: ${formatNumber(item.profit_2percent)}</div>
                <div>선물 송금액: ${formatNumber(item.futures_transfer)}</div>
            `;
            break;
        case 'deposit':
            content = `
                <div>오늘 입금액: ${formatWon(item.deposit_amount)}</div>
                <div>1%: ${formatWon(item.one_percent)}</div>
                <div>개인 법인: ${formatWon(item.personal_corporate)}</div>
                <div>빗썸 입금액: ${formatWon(item.bithumb_deposit)}</div>
            `;
            break;
        case 'withdrawal':
            content = `
                <div>출금 요청액: ${formatNumber(item.withdrawal_request)}</div>
                <div>2% 수익: ${formatNumber(item.two_percent)}</div>
                <div>빗썸 출금금액: ${formatNumber(item.bithumb_withdrawal)}</div>
                <div>환매 후 원화금액: ${formatWon(item.won_amount)}</div>
                <div>1% 수익: ${formatWon(item.one_percent)}</div>
                <div>고객 출금금액: ${formatWon(item.customer_withdrawal)}</div>
            `;
            break;
        case 'distribution':
            content = `
                <div>출금 요청액: ${formatNumber(item.withdrawal_request)}</div>
                <div>고객 출금금액: ${formatWon(item.customer_withdrawal)}</div>
            `;
            for (let i = 1; i <= 5; i++) {
                if (item[`customer${i}_amount`]) {
                    content += `<div>고객${i}: ${formatNumber(item[`customer${i}_amount`])} → ${formatWon(item[`customer${i}_result`])}</div>`;
                }
            }
            break;
    }
    
    return `
        <div class="history-item">
            <div class="history-checkbox">
                <input type="checkbox" class="history-check" data-id="${item.id}" onchange="toggleDeleteButton()">
            </div>
            <div class="history-content-wrapper">
                <div class="history-date"><i class="fas fa-clock"></i> ${dateStr}</div>
                <div class="history-data">${content}</div>
            </div>
        </div>
    `;
}

// ========================================
// 체크박스 및 삭제 기능
// ========================================
function toggleDeleteButton() {
    const checkedBoxes = document.querySelectorAll('.history-check:checked');
    const deleteBtn = document.getElementById('deleteBtn');
    const copySelectedBtn = document.getElementById('copySelectedBtn');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const allCheckboxes = document.querySelectorAll('.history-check');
    
    // 버튼 표시/숨김
    if (checkedBoxes.length > 0) {
        deleteBtn.style.display = 'inline-flex';
        copySelectedBtn.style.display = 'inline-flex';
    } else {
        deleteBtn.style.display = 'none';
        copySelectedBtn.style.display = 'none';
    }
    
    // 전체 선택 체크박스 상태 업데이트
    if (checkedBoxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedBoxes.length === allCheckboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
}

function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const allCheckboxes = document.querySelectorAll('.history-check');
    
    allCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
    
    toggleDeleteButton();
}

async function deleteSelectedHistory() {
    const checkedBoxes = document.querySelectorAll('.history-check:checked');
    
    if (checkedBoxes.length === 0) {
        alert('삭제할 항목을 선택해주세요.');
        return;
    }
    
    if (!confirm(`선택한 ${checkedBoxes.length}개 항목을 삭제하시겠습니까?`)) {
        return;
    }
    
    let tableName = '';
    switch(currentHistoryType) {
        case 'xrp':
            tableName = 'xrp_calculations';
            break;
        case 'deposit':
            tableName = 'deposit_calculations';
            break;
        case 'withdrawal':
            tableName = 'withdrawal_calculations';
            break;
        case 'distribution':
            tableName = 'distribution_calculations';
            break;
    }
    
    // LocalStorage에서 삭제
    checkedBoxes.forEach(checkbox => {
        const id = checkbox.getAttribute('data-id');
        deleteFromLocalStorage(tableName, id);
    });
    
    alert('삭제되었습니다.');
    loadHistory();
}

async function copySelectedHistory() {
    const checkedBoxes = document.querySelectorAll('.history-check:checked');
    
    if (checkedBoxes.length === 0) {
        alert('복사할 항목을 선택해주세요.');
        return;
    }
    
    let tableName = '';
    switch(currentHistoryType) {
        case 'xrp':
            tableName = 'xrp_calculations';
            break;
        case 'deposit':
            tableName = 'deposit_calculations';
            break;
        case 'withdrawal':
            tableName = 'withdrawal_calculations';
            break;
        case 'distribution':
            tableName = 'distribution_calculations';
            break;
    }
    
    // LocalStorage에서 데이터 가져오기
    const allData = loadFromLocalStorage(tableName);
    const selectedIds = Array.from(checkedBoxes).map(cb => cb.getAttribute('data-id'));
    const selectedData = allData.filter(item => selectedIds.includes(item.id));
    
    // 텍스트 생성
    let copyText = '';
    selectedData.forEach((item, index) => {
        const reportDate = new Date(item.calculation_date).toLocaleDateString('ko-KR');
        copyText += `[작성일: ${reportDate}]\n\n`;
        copyText += generateCopyText(item, currentHistoryType);
        
        if (index < selectedData.length - 1) {
            copyText += '\n====================\n\n';
        }
    });
    
    try {
        await navigator.clipboard.writeText(copyText);
        showCopySuccess();
    } catch (err) {
        alert('복사에 실패했습니다.');
    }
}

function generateCopyText(item, type) {
    switch(type) {
        case 'xrp':
            return `1. 기존바이낸스잔액: ${formatNumber(item.balance)}
2. xrp 전송: ${formatNumber(item.xrp_sent)}
3. 바이낸스에서 xrp매도후 테더금액: ${formatNumber(item.usdt_after_sale)}
4. 순xrp매도액: ${formatNumber(item.net_xrp_sale)}
5. 2%수익: ${formatNumber(item.profit_2percent)}
6. 선물사송금액: ${formatNumber(item.futures_transfer)}`;
        
        case 'deposit':
            return `1. 오늘입금액: ${formatWon(item.deposit_amount)}
2. 1%: ${formatWon(item.one_percent)}
3. 개인 법인(각0.5%씩): ${formatWon(item.personal_corporate)}
4. 빗썸입금액: ${formatWon(item.bithumb_deposit)}`;
        
        case 'withdrawal':
            return `1. 출금요청액: ${formatNumber(item.withdrawal_request)}
2. 2%수익: ${formatNumber(item.two_percent)}
3. 빗썸 출금금액: ${formatNumber(item.bithumb_withdrawal)}
4. 환매후 원화금액: ${formatWon(item.won_amount)}
5. 1%수익: ${formatWon(item.one_percent)}
6. 고객 출금금액: ${formatWon(item.customer_withdrawal)}`;
        
        case 'distribution':
            let text = `출금 요청액: ${formatNumber(item.withdrawal_request)}
고객 출금금액: ${formatWon(item.customer_withdrawal)}\n\n`;
            for (let i = 1; i <= 5; i++) {
                if (item[`customer${i}_amount`]) {
                    text += `고객${i}: ${formatNumber(item[`customer${i}_amount`])} / ${formatNumber(item.withdrawal_request)} × ${formatWon(item.customer_withdrawal)} = ${formatWon(item[`customer${i}_result`])}\n`;
                }
            }
            return text;
    }
}
