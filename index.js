const axios = require('axios');
const readline = require('readline');
const xlsx = require('node-xlsx');
const fs = require('fs');

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
async function main(instance) {
    let body;
    let i = 1;
    let pages0 = 1;
    const data = [
        ["流水号", "医保耗材编码", "挂网状态", "规格", "型号", "挂网状态备注"]
    ];
    do {
        await timeout(500);
        try {
            body = await instance.post('tps-local/web/trans/pub_online/mcs/prod/query_rslt', {
                "prodCode": "",
                "prodName": "",
                "aprvno": "",
                "regcert": "",
                "mgtType": "",
                "tenditmId": "",
                "prodentpName": "",
                "expyStas": "",
                "listAttrCode": "",
                "pubonlnStas": "",
                "current": i,
                "size": 10,
                "tenditmType": "2"
            });
        } catch (error) {
            console.error('error>>>', error);
            continue;
        }
        if (body.data.code !== 0) {
            console.error('body>>>', body.data);
            continue;
        }
        i++;
        let res = body.data.data;
        // pages0 = res.pages;

        for (let item of res.records) {
            let j = 1;
            let pages1 = 1;
            do {
                await timeout(500);
                console.log('页数i>>>', i + '/' + pages0, '页数j>>>', j + '/' + pages1, '当前>>>', item.prodCode);
                try {
                    body = await instance.post('tps-local/web/trans/mcs/specmod/query_page', {
                        "mcsCode": "",
                        "mcsSpec": "",
                        "mcsMol": "",
                        "current": j,
                        "size": 10,
                        "mergMcsCode": item.prodCode,
                        "tenditmId": "",
                        "medinsCode": "",
                        "tenditmType": "2"
                    });
                } catch (error) {
                    console.error('error>>>', error);
                    continue;
                }

                if (body.data.code !== 0) {
                    console.error('body>>>', body.data);
                    continue;
                }
                j++;
                let res1 = body.data.data;
                pages1 = res1.pages;
                res1.records.forEach(item => {
                    data.push([item.mergMcsCode, item.mcsCode, item.pubonlnStasVal, item.mcsSpec, item.mcsMol, item.pubonlnStasMemo]);
                });
            } while (j <= pages1);
        }
    } while (i <= pages0)
    var buffer = xlsx.build([{ name: 'data', data: data }]); // Returns a buffer
    fs.writeFileSync('data.xlsx', buffer, 'binary');
    console.log('成功');
}
rl.question(`请输入域名端口（默认 http://tps.ahyycg.cn:8666）： `, (Origin) => {
    Origin = Origin || "http://tps.ahyycg.cn:8666"
    rl.question(`请输入Authorization： `, (Authorization) => {
        console.log({ Origin, Authorization });
        const instance = axios.create({
            baseURL:  Origin + '/',
            timeout: 5000,
            headers: {
                "accept": "application/json, text/plain, */*",
                "accept-language": "zh-CN,zh;q=0.9",
                "accounttype": "",
                "authorization": Authorization,
                "content-type": "application/json;charset=UTF-8",
                "prodtype": "2",
                "proxy-connection": "keep-alive",
                "refreshtoken": "",
                "x-xsrf-token": "null"
            }
        });

        main(instance);
    })
});