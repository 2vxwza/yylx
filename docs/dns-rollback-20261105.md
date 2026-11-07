DNS rollback snapshot — yylx.tv zone, captured 2026-11-05 before apex migration
console: https://dnsnext.console.aliyun.com/authoritative/domains/yylx.tv
nameservers: dns25.hichina.com / dns26.hichina.com (Aliyun 免费版, TTL 10分钟)

RECORDS BEFORE CHANGE
1. host=@  type=显性URL  line=默认  value=`301|https://zhx-prod.jikeint.com/registerSign?isShare=1&invitationCode=60691753&lang=zh-CN&nation_id=CN`  算法=轮询  TTL=10分钟  状态=启用  修改时间=2026-11-05 14:56:51
2. host=www type=显性URL  line=默认  value=`301|https://zhx-prod.jikeint.com/registerSign?isShare=1&invitationCode=60691753&lang=zh-CN&nation_id=CN`  算法=轮询  TTL=10分钟  状态=启用  修改时间=2026-10-31 18:19:16
3. host=go  type=CNAME   line=默认  value=`2vxwza.github.io`  TTL=10分钟  状态=启用  修改时间=2026-11-05 17:48:53

CHANGE BEING MADE (approved by user with "改吧")
- DELETE record 1 (@ 显性URL).
- ADD four A records for host=@ → 185.199.108.153 / 185.199.109.153 / 185.199.110.153 / 185.199.111.153 (GitHub Pages apex IPs), TTL 10分钟.
- KEEP record 2 (www 显性URL) as the live "type-domain → register page with code" safety net.
- KEEP record 3 (go CNAME); GitHub will 301 go.yylx.tv → yylx.tv.

ROLLBACK = delete the four A records, re-create record 1 exactly as written above.
