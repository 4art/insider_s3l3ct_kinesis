const axios = require('axios').default;
const s3Service = require('./s3Service');
const converter = require('./converter');
const helper = require('./converter');
const { Converter } = require('aws-sdk/clients/dynamodb');
process.env.select_bucket = "myinsiderposition-dev"
const ipRegex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]):[0-9]+$/gm;

exports.proxiesService = new ProxiesService()

function ProxiesService() {
    this.findNewProxies = () => axios.get("https://free-proxy-list.net/")
        .then(function (response) {
            let str = response.data
            let m;
            var result = []
            while ((m = ipRegex.exec(str)) !== null) {
                // This is necessary to avoid infinite loops with zero-width matches
                if (m.index === ipRegex.lastIndex) {
                    ipRegex.lastIndex++;
                }

                result.push(m[0])
            }
            return result
        })
        .then(v => v.map(v => ({ host: v.split(":")[0], port: v.split(":")[1] })))

    this.getMergedProxies = async () => {
        let oldProxies = s3Service.proxiesSelect(process.env.select_bucket).getAllProxies().then(v => JSON.parse(v))
        let newProxies = await this.findNewProxies()
        return oldProxies.then(v =>
            v.concat(newProxies))
            .then(v =>
                converter.removeDuplicates(v, "host"))
    }

    this.updateAllProxies = async () => {
        const l = await this.getMergedProxies()
        //const testedProxiesPromise = this.updateTestedProxies(l)
        const s = converter.convertArrToS3Json(l)
        return s3Service.upload(s, "allProxies.json", process.env.select_bucket)
        //const testedProxies = await testedProxiesPromise;
        //const w = converter.convertArrToS3Json(testedProxies)
        //return s3Service.upload(w, "testedProxies.json", process.env.select_bucket).then(v => testedProxies)
    }

    this.updateTestedProxies = async (allProxies) => {
        let promises = allProxies.map(async (v, index) => {
            let start = new Date()
            let result = {}
            await axios.get("http://dummy.restapiexample.com/api/v1/employees", { proxy: v, timeout: 30000 })
                .then(response => {
                    let end = new Date() - start
                    JSON.stringify(response.data)
                    console.log(`Successed index: ${index} obj: ${JSON.stringify({ ...v, timeMs: end })}`)
                    result = {
                        ...v,
                        timeMs: end,
                        success: true
                    }
                    return result
                })
                .catch(err => {
                    console.log(`Failed index: ${index}, obj: ${JSON.stringify({ ...v, err: err.toString() })}`)
                    result = { ...v, err: err.toString(), success: false }
                })
            return result
        })
        let result = await Promise.all(promises)
        return result
    }

    this.getWorkedProxies = () => s3Service.proxiesSelect(process.env.select_bucket).getWorkedProxies().then(v => 
        JSON.parse(v).sort((a, b) => b.timeMs-a.timeMs))

    this.getAllProxies = () => s3Service.proxiesSelect(process.env.select_bucket).getAllProxies().then(v => JSON.parse(v))

}