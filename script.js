(function(console){

    console.save = function(data, filename){

        if(!data) {
            console.error('Console.save: No data')
            return;
        }

        if(!filename) filename = 'console.json'

        if(typeof data === "object"){
            data = JSON.stringify(data, undefined, 4)
        }

        var blob = new Blob([data], {type: 'text/json'}),
            e    = document.createEvent('MouseEvents'),
            a    = document.createElement('a')

        a.download = filename
        a.href = window.URL.createObjectURL(blob)
        a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':')
        e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
        a.dispatchEvent(e)
    }
})(console)


let api_token = "";
let business_id = "";

async function fetchData(data) {

    const res = await fetch ("https://gql.waveapps.com/graphql/public", 
                             { 
                                 method:"POST", 
                                 body: JSON.stringify(data),
                                 headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Bearer ' + api_token
                                 }
                            });
    const record = await res.json();
    return record;
}

async function getCurrentBusiness(){
    
}

async function getCustomerBalances(){
    let records = [];
    let page = 1;
    let record = null;
    do{
        const data = {
            operationName:null,
            variables:{},
            query: "{ \
                        business(id:\""+business_id+"\") { \
                            customers(page:"+page+", pageSize:50, sort: [NAME_ASC]) { \
                                pageInfo { \
                                    currentPage \
                                    totalPages \
                                    totalCount \
                                } \
                                edges { \
                                    node{ \
                                        id \
                                        name \
                                        email \
                                        website \
                                        outstandingAmount{ \
                                            value \
                                        } \
                                        overdueAmount{ \
                                            value \
                                        } \
                                    } \
                                } \
                            } \
                        } \
                    }"
        };
        record = await fetchData(data);
        records.push.apply(records, record.data.business.customers.edges);
        page++;
    }while(page <= record.data.business.customers.pageInfo.totalPages);

    return records;
}

async function getScoutAccounts(){
    let records = [];
    let page = 1;
    let record = null;
    do{
        const data = {
            operationName:null,
            variables:{},
            query: "{ \
                        business(id:\""+business_id+"\") { \
                            accounts(page:"+page+", pageSize:50, types: [LIABILITY], subtypes: [CUSTOMER_PREPAYMENTS_AND_CREDITS]) { \
                                pageInfo { \
                                    currentPage \
                                    totalPages \
                                    totalCount \
                                } \
                                edges { \
                                    node { \
                                        name \
                                        balance \
                                    } \
                                } \
                            } \
                        } \
                    }"
        };
        record = await fetchData(data);
        records.push.apply(records, record.data.business.accounts.edges);
        page++;
    }while(page <= record.data.business.accounts.pageInfo.totalPages);

    return records;
}

async function saveSettings(){
    chrome.storage.local.set({
        api_token: document.getElementById("api_token").value,
        business_id: document.getElementById("business_id").value,
    });
    await readSettings();
}

async function readSetting(key){
    return new Promise((resolve) => {
        chrome.storage.local.get([key], function(result) {
            resolve(result[key]);
        });
    })
}

async function readSettings(){
    let value = await readSetting("api_token");
    document.getElementById("api_token").value = value;
    api_token = value;

    value = await readSetting("business_id");
    document.getElementById("business_id").value = value;
    business_id = value;
}

function showPage(page_id){
    document.querySelectorAll(".content-page").forEach((page) => {
        page.style.display = 'none';
    });
    let element = document.getElementById(page_id);
    element.style.display = 'block';

    let event;
    if(document.createEvent){
        event = document.createEvent("HTMLEvents");
        event.initEvent("show", true, true);
        event.eventName = "show";
        element.dispatchEvent(event);
    } else {
        event = document.createEventObject();
        event.eventName = "show";
        event.eventType = "show";
        element.fireEvent("on" + event.eventType, event);
    }
}

async function showStatements(){
    let balanceRecords = await getCustomerBalances();
    let scoutAccounts = await getScoutAccounts();

    document.querySelectorAll(".statement-row").forEach((row) => {
        row.parentElement.removeChild(row);
    });

    let table = document.getElementById("statements_table");
    balanceRecords.forEach(async (invoice) => {
        
        let name = '';
        if(undefined != invoice.node.name && null != invoice.node.name){
            name = invoice.node.name;
        }

        let email = '';
        if(undefined != invoice.node.email && null != invoice.node.email){
            email = invoice.node.email;
        }

        let website = '';
        if(undefined != invoice.node.website && null != invoice.node.website){
            website = invoice.node.website;
        }

        let scoutAccount = null;
        for(let i = 0; i < scoutAccounts.length; i++){
            let scoutName = scoutAccounts[i].node.name.replace("Scout Account - ", "");
            if(scoutName === name){
                scoutAccount = scoutAccounts[i].node;
                break;
            }
        }

        let row = table.insertRow();
        row.setAttribute("class", "statement-row");

        //link to statement
        let cell = row.insertCell();
        if(website != ''){
            let a = document.createElement('a');
            a.appendChild(document.createTextNode(name));
            a.setAttribute("class", "statement-link");
            a.setAttribute("data-email", email);
            a.title = "Click to open statement";
            a.href = website;
            cell.prepend(a);
        }
        else{
            cell.setAttribute("class", "statement-link");
            cell.setAttribute("data-email", email);
            cell.innerText = name;
        }

        //invoice balance
        let balance = 0;
        if(invoice.node.outstandingAmount.value > 0){
            balance = invoice.node.outstandingAmount.value;
        }
        cell = row.insertCell();
        cell.setAttribute("class", "statement-balance");
        cell.innerText = currency(balance);

        //overdue balance
        balance = 0;
        if(invoice.node.overdueAmount.value > 0){
            balance = invoice.node.overdueAmount.value;
        }
        cell = row.insertCell();
        cell.setAttribute("class", "statement-overdue");
        cell.innerText = currency(balance);

        //scout account balance
        balance = 0;
        if(null != scoutAccount){
            balance = scoutAccount.balance;
        }
        cell = row.insertCell();
        cell.setAttribute("class", "scout-account-balance");
        cell.innerText = currency(balance);
    });
}

const currency = function(number){
    return new Intl.NumberFormat('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits: 2}).format(number);
};

function openAllStatements(){
    document.querySelectorAll(".statement-link").forEach((page) => {
        window.open(page.href, "_blank");
    });
}

function convertToCSV(json) {
    var fields = Object.keys(json[0])
    var replacer = function(key, value) { return (undefined == value || value === null) ? '' : value.replace(/,/g, '\,') } 
    var csv = json.map(function(row){
        return fields.map(function(fieldName){
            return JSON.stringify(row[fieldName], replacer)
        }).join(',');
    });
    csv.unshift(fields.join(',')); // add header column
    csv = csv.join('\r\n');

    return csv;
}

function exportStatementData(){
    let data = [];
    let today = new Date();
    let todayStr = (today.getMonth()+1) + "/" + today.getDate() + "/" + today.getFullYear();
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

    console.save(convertToCSV(data), 'export.csv');
}

async function statementsTabShown(){
    await showStatements();
}

async function startUp(){
    //hide all pages
    document.querySelectorAll(".content-page").forEach((page) => {
        page.style.display = 'none';
    });

    //button events
    document.querySelectorAll(".nav-button").forEach((button) => {
        button.addEventListener("click", function() {
            showPage(button.getAttribute("data-page-id"));
        });
    });

    document.getElementById("btn_save_settings").addEventListener("click", function() {
        saveSettings();
    });

    document.getElementById("btn_open_all_statements").addEventListener("click", function() {
        openAllStatements();
    });

    document.getElementById("btn_export_statement_report").addEventListener("click", function() {
        exportStatementData();
    });

    //onshow events
    document.getElementById("statements_tab").addEventListener("show", async function() { 
        await showStatements();
    });

    await readSettings();
    showPage("statements_tab");
}

startUp();