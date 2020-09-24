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
        const s = converter.convertArrToS3Json(l)
        return s3Service.upload(s, "allProxies.json", process.env.select_bucket)
    }

}

new ProxiesService().updateAllProxies()