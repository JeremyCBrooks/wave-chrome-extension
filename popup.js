async function showStatements() {

    document.querySelectorAll(".statement-row").forEach((row) => {
        row.parentElement.removeChild(row);
    });

    let table = document.getElementById("statements_table");

    let records = await api_client.getCombinedBalanceAndScoutAccounts();
    records.forEach((record) => {

        let row = table.insertRow();
        row.setAttribute("class", "statement-row");

        //link to statement
        let cell = row.insertCell();
        cell.setAttribute("class", "statement-link");
        cell.setAttribute("data-email", record.email);
        cell.innerText = record.name;

        //overdue balance
        cell = row.insertCell();
        cell.setAttribute("class", "statement-overdue");
        cell.innerText = utils.currency(record.overdueBalance);

        //scout account balance
        cell = row.insertCell();
        cell.setAttribute("class", "scout-account-balance");
        cell.innerText = utils.currency(record.scoutAccountBalance);
    });
}

function exportStatementData() {
    let data = [];
    let today = new Date();
    let todayStr = (today.getMonth() + 1) + "/" + today.getDate() + "/" + today.getFullYear();
    document.querySelectorAll(".statement-row").forEach((row) => {
        let statement_link = row.querySelector(".statement-link");
        data.push({
            name: statement_link.innerText,
            email: statement_link.getAttribute("data-email"),
            statement_link: statement_link.href,
            statement_balance: row.querySelector(".statement-balance").innerText,
            scout_account_balance: row.querySelector(".scout-account-balance").innerText,
            date: todayStr,
        });
    });

    utils.save(convertToCSV(data), 'export.csv');
}

async function statementsTabShown() {
    await showStatements();
}

async function startUp() {
    //hide all pages
    document.querySelectorAll(".content-page").forEach((page) => {
        page.style.display = 'none';
    });

    //button events
    document.querySelectorAll(".nav-button").forEach((button) => {
        button.addEventListener("click", function () {
            document.showPage(button.getAttribute("data-page-id"));
        });
    });

    document.getElementById("btn_save_settings").addEventListener("click", function () {
        settings.saveSettings({
            api_token: document.getElementById("api_token").value,
            business_id: document.getElementById("business_id").value,
            statement_template: document.getElementById("statement_template").value,
        });
    });

    document.getElementById("btn_export_statement_report").addEventListener("click", function () {
        exportStatementData();
    });

    //onshow events
    document.getElementById("statements_tab").addEventListener("show", async function () {
        await showStatements();
    });

    await settings.loadSettings();

    document.getElementById("api_token").value = settings.api_token;
    document.getElementById("business_id").value = settings.business_id;
    document.getElementById("statement_template").value = settings.statement_template;
    
    document.showPage("statements_tab");
}

startUp();