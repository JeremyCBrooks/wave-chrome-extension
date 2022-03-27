let api_client = {

    fetchData: async function (data) {

        const res = await fetch("https://gql.waveapps.com/graphql/public",
            {
                method: "POST",
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + settings.api_token
                }
            });
        const record = await res.json();
        return record;
    },

    getCustomerBalances: async function (filterEmail) {
        let records = [];
        let page = 1;
        let record = null;
        do {
            let filterEmailVars = {};
            if (filterEmail) {
                filterEmailVars = { email: filterEmail };
            }
            const filterEmailQuery = (filterEmail ? ", email:$email" : "");
            const queryPrefix = (filterEmail ? "query ($email: String!)" : "query");

            const data = {
                operationName: null,
                variables: filterEmailVars,
                query: queryPrefix + " { \
                            business(id:\""+ settings.business_id + "\") { \
                                customers(page:"+ page + ", pageSize:50, sort:[NAME_ASC]" + filterEmailQuery + ") { \
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
            record = await api_client.fetchData(data);
            records.push.apply(records, record.data.business.customers.edges);
            page++;
        } while (page <= record.data.business.customers.pageInfo.totalPages);

        return records;
    },

    getScoutAccounts: async function () {
        let records = [];
        let page = 1;
        let record = null;
        do {
            const data = {
                operationName: null,
                variables: {},
                query: "{ \
                            business(id:\""+ settings.business_id + "\") { \
                                accounts(page:"+ page + ", pageSize:50, types: [LIABILITY], subtypes: [CUSTOMER_PREPAYMENTS_AND_CREDITS]) { \
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
            record = await api_client.fetchData(data);
            records.push.apply(records, record.data.business.accounts.edges);
            page++;
        } while (page <= record.data.business.accounts.pageInfo.totalPages);

        return records;
    },

    getCombinedBalanceAndScoutAccounts: async function (filterEmail) {
        let balanceRecords = await api_client.getCustomerBalances(filterEmail);
        let scoutAccounts = await api_client.getScoutAccounts();
        let records = [];
        balanceRecords.forEach((invoice) => {

            let name = '';
            if (undefined != invoice.node.name && null != invoice.node.name) {
                name = invoice.node.name;
            }

            let email = '';
            if (undefined != invoice.node.email && null != invoice.node.email) {
                email = invoice.node.email;
            }

            let scoutAccount = null;
            for (let i = 0; i < scoutAccounts.length; i++) {
                let scoutName = scoutAccounts[i].node.name.replace("Scout Account - ", "");
                if (scoutName === name) {
                    scoutAccount = scoutAccounts[i].node;
                    break;
                }
            }

            //current due balance
            let dueBalance = 0;
            if (invoice.node.outstandingAmount.value > 0) {
                dueBalance = invoice.node.outstandingAmount.value;
            }

            //overdue balance
            let overdueBalance = 0;
            if (invoice.node.overdueAmount.value > 0) {
                overdueBalance = invoice.node.overdueAmount.value;
            }

            //scout account balance
            let scoutAccountBalance = 0;
            if (null != scoutAccount) {
                scoutAccountBalance = scoutAccount.balance;
            }

            records.push({
                name: name,
                email: email,
                dueBalance: dueBalance,
                overdueBalance: overdueBalance,
                scoutAccountBalance: scoutAccountBalance,
            });
        });

        return records;
    },
};