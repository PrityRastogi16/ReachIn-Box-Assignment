const Redis = require("ioredis");
require("dotenv").config()
const redisConnection = new Redis({
    port:process.env.redis_port,
    host:process.env.redis_host,
    password:process.env.redis_pass
},{
    maxRetriesPerRequest: null
});

module.exports = {
    redisConnection
}