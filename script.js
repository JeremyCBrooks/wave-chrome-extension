let api_token = "";
let business_id = "";
let business_guid = "";

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
    console.log(record);
    return record;
}

async function getCurrentBusiness(){
    
}

async function getCustomerBalances(){
    const data = {
        operationName:null,
        variables:{},
        query: "{ \
                business(id:\""+business_id+"\") { \
                    customers { \
                        edges { \
                            node{ \
                                id \
                                name \
                                outstandingAmount{ \
                                    value \
                                } \
                            } \
                        } \
                    } \
                } \
            }"
    };

    return await fetchData(data);
}

async function saveSettings(){
    chrome.storage.local.set({
        api_token: document.getElementById("api_token").value,
        business_id: document.getElementById("business_id").value,
        business_guid: document.getElementById("business_guid").value,
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

    value = await readSetting("business_guid");
    document.getElementById("business_guid").value = value;
    business_guid = value;
}

function showPage(page_id){
    document.querySelectorAll(".content-page").forEach((page) => {
        page.style.display = 'none';
    });
    document.getElementById(page_id).style.display = 'block';
}

async function showCustomersWithBalances(){
    var record = await getCustomerBalances();

    var table = document.getElementById("customer_statements_table");
    record.data.business.customers.edges.forEach(async (customer) => {
        if(customer.node.outstandingAmount.value > 0){

            var row = table.insertRow();
            var cell = row.insertCell();
            var a = document.createElement('a');
            a.appendChild(document.createTextNode(customer.node.name));
            a.setAttribute("class", "customer-statement-link");
            a.title = "Click to open statement";
            a.href = "https://next.waveapps.com/"+business_guid+"/customer-statements/"+customer.node.id;
            cell.prepend(a);
            cell = row.insertCell();
            cell.innerText = customer.node.outstandingAmount.value;
        }
    });
}

function openAllCustomerStatements(){
    document.querySelectorAll(".customer-statement-link").forEach((page) => {
        window.open(page.href, "_blank");
    });
}

async function startUp(){
    document.querySelectorAll(".content-page").forEach((page) => {
        page.style.display = 'none';
    });

    document.querySelectorAll(".nav-button").forEach((button) => {
        button.addEventListener("click", function() {
            showPage(button.getAttribute("data-page-id"));
        });
    });

    document.getElementById("btn_save_settings").addEventListener("click", function() {
        saveSettings();
    });

    document.getElementById("btn_open_all_statements").addEventListener("click", function() {
        openAllCustomerStatements();
    });

    await readSettings();
    showPage("customer_statements_tab");
    await showCustomersWithBalances();
}

startUp();