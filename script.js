document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('transaction-form');
    const transactionList = document.getElementById('transaction-list');
    const balance = document.getElementById('balance');
    const historyButton = document.getElementById('history-button');
    const deleteButton = document.getElementById('delete-button');
    const newCashbookButton = document.getElementById('new-cashbook-button');
    const cashbookSelect = document.getElementById('cashbook-select');
    const typeSelect = document.getElementById('type');
    const personNameInput = document.getElementById('person-name');
    const addPersonButton = document.getElementById('add-person');
    const methodSelect = document.getElementById('method');
    const peopleList = document.getElementById('people-list');

    let cashbooks = JSON.parse(localStorage.getItem('cashbooks')) || {};
    let currentCashbook = localStorage.getItem('currentCashbook') || 'Default Cashbook';
    let people = JSON.parse(localStorage.getItem('people')) || [];
    let dues = JSON.parse(localStorage.getItem('dues')) || {};

    if (!cashbooks[currentCashbook]) {
        cashbooks[currentCashbook] = [];
    }

    function populatePeopleList() {
        peopleList.innerHTML = '';
        people.forEach(person => {
            const option = document.createElement('option');
            option.value = person;
            peopleList.appendChild(option);
        });
    }

    function togglePersonFields() {
        const type = typeSelect.value;
        const isDueOrRepayment = type === 'due' || type === 'repayment';
        const isCashInOutOrRepayment = type === 'in' || type === 'out' || type === 'repayment';

        personNameInput.disabled = !isDueOrRepayment;
        addPersonButton.disabled = !isDueOrRepayment;
        methodSelect.disabled = !isCashInOutOrRepayment;

        if (isDueOrRepayment) {
            addPersonButton.classList.remove('disabled');
        } else {
            addPersonButton.classList.add('disabled');
        }
    }

    typeSelect.addEventListener('change', togglePersonFields);
    togglePersonFields();

    addPersonButton.addEventListener('click', () => {
        const personName = personNameInput.value.trim();
        if (personName && !people.includes(personName)) {
            people.push(personName);
            localStorage.setItem('people', JSON.stringify(people));
            populatePeopleList();
        }
        personNameInput.value = '';
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const description = document.getElementById('description').value;
        let amount = parseFloat(document.getElementById('amount').value);
        const type = typeSelect.value;
        const method = document.getElementById('method').value;
        const person = personNameInput.value.trim();
        const date = new Date().toISOString();  // Get the current date and time

        if (type === 'repayment') {
            amount = Math.abs(amount); // Ensure repayment amount is positive
        }

        let transaction = {
            description,
            amount: (type === 'in' || type === 'repayment') ? amount : -amount,
            method,
            type,
            person,
            date  // Include the date in the transaction object
        };

        if (type === 'due' && person) {
            dues[person] = (dues[person] || 0) + amount;
            localStorage.setItem('dues', JSON.stringify(dues));
        } else if (type === 'repayment' && person) {
            dues[person] = (dues[person] || 0) - amount;
            if (dues[person] < 0) dues[person] = 0;
            localStorage.setItem('dues', JSON.stringify(dues));
        }

        cashbooks[currentCashbook].push(transaction);
        saveCashbooks();
        updateTransactions();
        form.reset();
        togglePersonFields();
    });

    historyButton.addEventListener('click', () => {
        window.location.href = 'history.html';
    });

    deleteButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete all transactions and data for the current cashbook?')) {
            cashbooks[currentCashbook] = [];
            delete dues[currentCashbook];
            localStorage.setItem('dues', JSON.stringify(dues));
            saveCashbooks();
            updateTransactions();
            alert('All data for the current cashbook has been deleted.');
        }
    });

    newCashbookButton.addEventListener('click', () => {
        const cashbookName = prompt('Enter the name of the new cashbook:');
        if (cashbookName) {
            cashbooks[cashbookName] = [];
            currentCashbook = cashbookName;
            localStorage.setItem('currentCashbook', currentCashbook);
            saveCashbooks();
            populateCashbookSelect();
            updateTransactions();
        }
    });

    cashbookSelect.addEventListener('change', (e) => {
        currentCashbook = e.target.value;
        localStorage.setItem('currentCashbook', currentCashbook);
        updateTransactions();
    });

    transactionList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-button')) {
            const index = e.target.dataset.index;
            cashbooks[currentCashbook].splice(index, 1);
            saveCashbooks();
            updateTransactions();
        }
    });

    function saveCashbooks() {
        localStorage.setItem('cashbooks', JSON.stringify(cashbooks));
    }

    function populateCashbookSelect() {
        cashbookSelect.innerHTML = '';
        for (const cashbook in cashbooks) {
            const option = document.createElement('option');
            option.value = cashbook;
            option.textContent = cashbook;
            if (cashbook === currentCashbook) {
                option.selected = true;
            }
            cashbookSelect.appendChild(option);
        }
    }

    function updateTransactions() {
        transactionList.innerHTML = '';
        let total = 0;

        cashbooks[currentCashbook].forEach((transaction, index) => {
            const li = document.createElement('li');
            const amountClass = transaction.amount < 0 ? 'amount-out' : 'amount-in';
            const displayAmount = Math.abs(transaction.amount);

            li.innerHTML = `
                ${transaction.description} (${transaction.method}):
                <span class="${amountClass}">${transaction.amount < 0 ? '-' : '+'}$${displayAmount.toFixed(2)}</span>
                ${transaction.person ? `(${transaction.person} - Due: ${dues[transaction.person] || 0})` : ''}
                <br>
                <small>Date: ${new Date(transaction.date).toLocaleString()}</small>
                <button class="delete-button" data-index="${index}">Delete</button>
            `;
            transactionList.appendChild(li);
            total += transaction.amount;
        });

        balance.textContent = `Balance: $${total.toFixed(2)} (${currentCashbook})`;
    }

    populateCashbookSelect();
    populatePeopleList();
    updateTransactions();
});
