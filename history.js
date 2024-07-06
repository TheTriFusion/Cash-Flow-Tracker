document.addEventListener('DOMContentLoaded', () => {
    const netBalance = document.getElementById('net-balance');
    const totalIn = document.getElementById('total-in');
    const totalOut = document.getElementById('total-out');
    const totalDue = document.getElementById('total-due');
    const historyList = document.getElementById('history-list');
    const downloadReport = document.getElementById('download-report');
    const personFilter = document.getElementById('person-filter');
    const cashbooks = JSON.parse(localStorage.getItem('cashbooks')) || {};
    const currentCashbook = localStorage.getItem('currentCashbook') || 'Default Cashbook';
    const dues = JSON.parse(localStorage.getItem('dues')) || {};
    const transactions = cashbooks[currentCashbook] || [];
    const people = JSON.parse(localStorage.getItem('people')) || [];

    let totalInValue = 0;
    let totalOutValue = 0;
    let netBalanceValue = 0;
    let totalDueValue = 0;

    function populatePersonFilter() {
        people.forEach(person => {
            const option = document.createElement('option');
            option.value = person;
            option.textContent = person;
            personFilter.appendChild(option);
        });
    }

    function filterTransactions(person) {
        totalInValue = 0;
        totalOutValue = 0;
        netBalanceValue = 0;
        totalDueValue = 0;
        historyList.innerHTML = '';

        transactions.forEach((transaction) => {
            if (person === 'all' || transaction.person === person) {
                const li = document.createElement('li');
                const amountClass = transaction.amount < 0 ? 'amount-out' : 'amount-in';
                const displayAmount = Math.abs(transaction.amount);

                li.innerHTML = `
                    <div class="transaction">
                        <span class="method">${transaction.method}</span>
                        <span class="description">${transaction.description}</span>
                        <span class="amount ${amountClass}">${transaction.amount < 0 ? '-' : '+'}$${displayAmount.toFixed(2)}</span>
                        ${transaction.person ? `<span class="person">(${transaction.person})</span>` : ''}
                        ${transaction.type === 'due' ? `<span class="due-amount">Due Amount: $${dues[transaction.person] || 0}</span>` : ''}
                    </div>
                    <small>Date: ${new Date(transaction.date).toLocaleString()}</small>
                `;

                historyList.appendChild(li);

                if (transaction.type === 'in') {
                    totalInValue += displayAmount;
                    netBalanceValue += displayAmount;
                } else if (transaction.type === 'out') {
                    totalOutValue += displayAmount;
                    netBalanceValue -= displayAmount;
                } else if (transaction.type === 'due') {
                    totalDueValue += displayAmount;
                } else if (transaction.type === 'repayment') {
                    totalInValue += displayAmount;
                    totalDueValue -= displayAmount;
                    netBalanceValue += displayAmount;
                }
            }
        });

        netBalance.textContent = `Net Balance: $${netBalanceValue.toFixed(2)}`;
        totalIn.textContent = `Total Cash In: $${totalInValue.toFixed(2)}`;
        totalOut.textContent = `Total Cash Out: $${totalOutValue.toFixed(2)}`;
        totalDue.textContent = `Total Due Balance: $${totalDueValue.toFixed(2)}`;
    }

    personFilter.addEventListener('change', (e) => {
        filterTransactions(e.target.value);
    });

    downloadReport.addEventListener('click', () => {
        let csvContent = 'data:text/csv;charset=utf-8,';
        csvContent += 'Description,Amount,Method,Type,Person,Current Due\n';

        transactions.forEach(transaction => {
            const currentDue = dues[transaction.person] ? dues[transaction.person] : 0;
            csvContent += `${transaction.description},${transaction.amount},${transaction.method},${transaction.type},${transaction.person},${currentDue}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'cash_flow_history.csv');
        document.body.appendChild(link);
        link.click();
    });

    populatePersonFilter();
    filterTransactions('all');
});
