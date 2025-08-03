import { Brain, X } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-1/4 h-96 w-96 rounded-full bg-cyan-500/30 blur-3xl" />
        <div className="absolute -right-1/4 top-1/2 h-96 w-96 rounded-full bg-violet-500/30 blur-3xl" />
      </div>

      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link className="flex items-center space-x-2 font-bold" href="/">
            <Brain className="h-6 w-6 text-cyan-400" />
            <span>小杏仁记忆搭子</span>
          </Link>
          <Link 
            href="/" 
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            title="关闭"
          >
            <X className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">用户协议</h1>
          <p className="text-center text-white/70 mb-8">最后更新: 2025年8月3日</p>
          
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="p-8 space-y-8">
              
              <section>
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">第一条 总则</h2>
                <div className="space-y-3 text-white/90">
                  <p>1.1 本协议是您与小杏仁记忆搭子（MemBuddy）服务提供者之间关于您使用小杏仁记忆搭子（MemBuddy）服务所订立的协议。本协议描述服务提供者与用户之间关于软件许可和服务使用相关方面的权利义务。"用户"是指使用小杏仁记忆搭子相关服务的使用人。</p>
                  <p>1.2 您应当在使用小杏仁记忆搭子服务之前认真阅读全部协议内容。如您不同意本服务协议的任意内容，或无法准确理解该条款，请不要进行后续操作。</p>
                  <p>1.3 您的使用行为或您以书面方式明示同意本协议，视为您已充分阅读、理解并接受本协议的全部内容，并与服务提供者达成一致，成为我们的用户。</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">第二条 服务内容</h2>
                <div className="space-y-3 text-white/90">
                  <p>2.1 小杏仁记忆搭子服务的具体内容由我们根据实际情况提供，主要包括但不限于AI记忆辅助工具生成、思维导图制作、记忆口诀创建、感官联想训练、间隔重复学习等。</p>
                  <p>2.2 您理解，我们仅提供相关服务，除此之外与相关服务有关的设备（如个人电脑、手机等）及所需的费用（如上网费、手机流量费等）均应由您自行负担。</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">第三条 用户个人信息保护</h2>
                <div className="space-y-3 text-white/90">
                  <p>3.1 用户在注册账号或使用小杏仁记忆搭子服务的过程中，需要提供一些必要的信息。如国家法律法规规定的其他信息，用户应当予以提供。</p>
                  <p>3.2 您上传或发布的所有内容，我们将严格保密，除非得到您的明确授权或国家法律法规要求，我们不会向任何第三方透露您的个人信息。</p>
                  <p>3.3 我们采取各种安全技术和程序，建立完善的管理制度来保护您的个人信息，防止信息丢失、被盗用或篡改。</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">第四条 用户行为规范</h2>
                <div className="space-y-3 text-white/90">
                  <p>4.1 用户不得利用小杏仁记忆搭子服务制作、上传、复制、发布、传播或者转载如下内容：</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>反对宪法所确定的基本原则的；</li>
                    <li>危害国家安全，泄露国家秘密，颠覆国家政权，破坏国家统一的；</li>
                    <li>损害国家荣誉和利益的；</li>
                    <li>煽动民族仇恨、民族歧视，破坏民族团结的；</li>
                    <li>破坏国家宗教政策，宣扬邪教和封建迷信的；</li>
                    <li>散布谣言，扰乱社会秩序，破坏社会稳定的；</li>
                    <li>散布淫秽、色情、赌博、暴力、凶杀、恐怖或者教唆犯罪的；</li>
                    <li>侮辱或者诽谤他人，侵害他人合法权益的；</li>
                    <li>含有法律、行政法规禁止的其他内容的。</li>
                  </ul>
                  <p>4.2 用户不得通过任何手段滥用小杏仁记忆搭子服务，包括但不限于以下行为：</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>自动化滥用：使用脚本、爬虫、机器人或其他非人工手段批量操作服务（经本公司书面授权的合法API调用除外）；</li>
                    <li>资源占用：高频次请求服务、占用过量服务器资源或干扰服务稳定性；</li>
                    <li>垃圾信息：生成或传播重复性、误导性、广告性内容或无关信息；</li>
                    <li>反规避行为：通过技术手段绕过安全限制（如IP屏蔽、验证码）或使用VPN隐藏滥用行为；</li>
                    <li>非法用途：用于欺诈、网络攻击、传播恶意软件或其他违法活动；</li>
                    <li>身份冒用：伪造身份、虚假注册、盗用他人账号或非法买卖账号。</li>
                  </ul>
                  <p>4.3 用户不得恶意注册或使用小杏仁记忆搭子账号，包括但不限于以任何方式盗用、占用、购买、出售账号。用户亦不得盗取他人账号、密码。</p>
                  <p>4.4 用户不得利用小杏仁记忆搭子服务生成的AI内容从事以下行为：</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>直接或间接侵犯他人知识产权（如剽窃、篡改原创内容）；</li>
                    <li>生成虚假信息、深度伪造内容或用于诽谤、诈骗等非法目的。</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">第五条 付费与退款</h2>
                <div className="space-y-3 text-white/90">
                  <p>5.1 用户理解并同意，一旦购买了小杏仁记忆搭子服务的付费服务，包括但不限于预充值、订阅等形式，相关费用将不予退还。</p>
                  <p>5.2 用户应当按照我们公布的价格支付相关费用，我们有权根据实际需要调整价格。</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">第六条 服务的变更、中断或终止</h2>
                <div className="space-y-3 text-white/90">
                  <p>6.1 鉴于网络服务的特殊性，用户同意我们有权随时变更、中断或终止部分或全部的服务（包括收费服务）。我们变更、中断或终止的服务，我们应当在变更、中断或终止之日或之前通知用户。</p>
                  <p>6.2 如发生下列任何一种情形，我们有权直接以取消账号的方式终止本协议：</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>用户提供的个人资料不真实；</li>
                    <li>用户违反法律法规国家政策或本协议中规定的使用规则；</li>
                    <li>用户存在本协议第四条所述的滥用行为。</li>
                  </ul>
                  <p>6.3 用户理解，我们需要定期或不定期地对提供网络服务的平台或相关的设备进行检修或者维护，如因此类情况而造成网络服务（包括收费服务）在合理时间内的中断，我们无需为此承担任何责任。</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">第七条 法律适用和管辖</h2>
                <div className="space-y-3 text-white/90">
                  <p>7.1 本协议的订立、执行和解释及争议的解决均应适用中华人民共和国法律。</p>
                  <p>7.2 如双方就本协议内容或其执行发生任何争议，应尽量友好协商解决；协商不成时，任何一方均可将争议提交至有管辖权的人民法院进行诉讼。</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">第八条 免责声明</h2>
                <div className="space-y-3 text-white/90">
                  <p>8.1 用户明确同意其使用小杏仁记忆搭子服务所存在的风险将完全由其自己承担。</p>
                  <p>8.2 我们不保证服务一定能满足用户的要求，也不保证服务不会中断，对服务的及时性、安全性、准确性也都不作保证。</p>
                  <p>8.3 对于因不可抗力或我们不能控制的原因造成的网络服务中断或其他缺陷，我们不承担任何责任。</p>
                  <p>8.4 我们不对用户所发布信息的保存、修改、删除或储存失败负责。对于系统崩溃或其他不可抗力事件导致的数据丢失，我们也不承担任何责任。</p>
                  <p>8.5 我们有权但无义务，改善或更正本服务任何部分之疏漏、不足。</p>
                  <p>8.6 除非我们以书面形式明确约定，我们对于用户在任何第三方网站所遭受的人身伤害（包括但不限于因网络传播而产生的侵权行为）不承担责任。</p>
                  <p>8.7 因用户滥用服务（包括但不限于第四条所述行为）导致的任何损失或法律纠纷，由用户自行承担责任，我们不承担任何直接或间接责任。</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">第九条 修改和解释</h2>
                <div className="space-y-3 text-white/90">
                  <p>9.1 我们有权随时修改本协议的任何条款，一旦本协议的内容发生变动，我们将会直接在小杏仁记忆搭子网站上公布修改之后的协议内容，该公布行为视为我们已经通知用户修改内容。</p>
                  <p>9.2 修改后的协议一经在小杏仁记忆搭子网站上公布后，立即自动生效。</p>
                  <p>9.3 如用户不同意相关变更，必须立即停止使用小杏仁记忆搭子服务。任何形式的使用行为将视为用户对修改后协议的接受。</p>
                  <p>9.4 本协议最终解释权归服务提供者所有。</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">第十条 AI生成内容</h2>
                <div className="space-y-3 text-white/90">
                  <p>10.1 用户理解并同意，通过小杏仁记忆搭子服务生成的AI内容仅供参考，我们不对其准确性、完整性或可靠性作出任何明示或暗示的保证。</p>
                  <p>10.2 用户应当自行判断并承担使用AI生成内容的风险。我们不承担因用户依赖这些内容而导致的任何直接或间接损失。</p>
                  <p>10.3 我们保留在无需通知的情况下，修改、更新或改进AI生成内容的权利。</p>
                  <p>10.4 用户不得利用小杏仁记忆搭子服务中的AI生成内容进行违法活动，或侵犯他人的知识产权或其他合法权益。</p>
                  <p>10.5 我们对用户因使用AI生成内容而遭受的任何形式的损失或伤害不承担任何责任。</p>
                  <p>10.6 用户理解并同意，我们有权通过技术手段（如流量分析、异常行为监测）对滥用行为进行识别，并采取限制访问、暂停服务等措施，且无需提前通知。</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">第十一条 其他</h2>
                <div className="space-y-3 text-white/90">
                  <p>11.1 本协议构成您与我们之间关于小杏仁记忆搭子服务使用的完整协议，取代您和我们先前和同时就相同服务所达成的任何形式的协议。</p>
                  <p>11.2 如本协议中的任何条款因任何原因被判定为完全或部分无效或不具有执行力，或违反任何适用的法律，则该条款视为删除，但本协议的其余条款仍应有效并且有执行力。</p>
                  <p>11.3 未行使或执行本协议任何权利或规定不构成对该权利或规定的放弃。</p>
                  <p>11.4 我们对本协议拥有最终解释和修改权。</p>
                </div>
              </section>

              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <p className="text-sm text-white/50">
                  本协议自发布之日起生效。
                </p>
                <p className="text-sm text-white/50 mt-2">
                  服务提供者保留对本协议的最终解释权。
                </p>
              </div>
              
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}