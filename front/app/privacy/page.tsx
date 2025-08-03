import { Brain, X } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold mb-8 text-center">隐私政策</h1>
          <p className="text-center text-white/70 mb-8">最后更新: 2025年8月3日</p>
          
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="p-8 space-y-8">
              
              <section>
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">第一条 总则</h2>
                <div className="space-y-3 text-white/90">
                  <p>1.1 本隐私政策是您与小杏仁记忆搭子（MemBuddy）服务提供者之间关于您使用小杏仁记忆搭子（MemBuddy）服务时个人信息保护的协议。</p>
                  <p>1.2 您应当在使用小杏仁记忆搭子服务之前认真阅读全部隐私政策内容。如您不同意本隐私政策的任意内容，请不要使用我们的服务。</p>
                  <p>1.3 您的使用行为或您以书面方式明示同意本政策，视为您已充分阅读、理解并接受本隐私政策的全部内容。</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">第二条 信息收集</h2>
                <div className="space-y-3 text-white/90">
                  <p>2.1 <strong>账户信息</strong>：当您注册账户时，我们会收集您的邮箱地址、用户名等基本信息。</p>
                  <p>2.2 <strong>记忆内容</strong>：您在使用服务过程中输入的记忆内容、生成的记忆辅助工具等数据。</p>
                  <p>2.3 <strong>使用数据</strong>：包括您的学习进度、复习记录、使用频率等服务使用相关信息。</p>
                  <p>2.4 <strong>设备信息</strong>：设备类型、操作系统、浏览器类型等技术信息，用于优化服务体验。</p>
                  <p>2.5 <strong>日志信息</strong>：访问时间、IP地址、访问页面等日志数据，用于安全防护和服务改进。</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">第三条 信息使用</h2>
                <div className="space-y-3 text-white/90">
                  <p>3.1 <strong>服务提供</strong>：使用您的信息为您提供记忆辅助、学习计划制定等核心服务功能。</p>
                  <p>3.2 <strong>个性化推荐</strong>：基于您的学习习惯和偏好，为您推荐合适的记忆方法和复习计划。</p>
                  <p>3.3 <strong>服务改进</strong>：分析用户使用数据以改进产品功能和用户体验。</p>
                  <p>3.4 <strong>安全保障</strong>：检测和防范安全威胁，保护用户账户和数据安全。</p>
                  <p>3.5 <strong>客户服务</strong>：为您提供技术支持和客户服务。</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">第四条 信息共享</h2>
                <div className="space-y-3 text-white/90">
                  <p>4.1 我们承诺不会向第三方出售、出租或以其他方式披露您的个人信息，除非：</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>获得您的明确同意</li>
                    <li>法律法规要求或政府部门要求</li>
                    <li>为保护我们、用户或公众的合法权益</li>
                    <li>与我们的服务提供商共享必要信息以提供服务（如云存储服务商）</li>
                  </ul>
                  <p>4.2 在与第三方服务提供商合作时，我们会要求其严格遵守保密义务，并采取适当的安全措施。</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">第五条 信息存储</h2>
                <div className="space-y-3 text-white/90">
                  <p>5.1 <strong>存储地点</strong>：您的个人信息主要存储在中华人民共和国境内的服务器上。</p>
                  <p>5.2 <strong>存储期限</strong>：我们仅在为您提供服务所必需的期间内保留您的个人信息。当您注销账户时，我们会删除您的个人信息，法律法规另有规定的除外。</p>
                  <p>5.3 <strong>数据备份</strong>：为保障数据安全，我们会定期进行数据备份，备份数据同样受到本隐私政策保护。</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">第六条 信息安全</h2>
                <div className="space-y-3 text-white/90">
                  <p>6.1 我们采用行业标准的安全措施保护您的个人信息，包括：</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>数据传输加密（HTTPS/TLS）</li>
                    <li>数据存储加密</li>
                    <li>访问权限控制</li>
                    <li>安全审计和监控</li>
                    <li>定期安全评估</li>
                  </ul>
                  <p>6.2 尽管我们采取了上述安全措施，但请您理解，在互联网环境下，不存在100%安全的数据传输和存储方式。</p>
                  <p>6.3 如发生个人信息安全事件，我们会及时通知您并采取补救措施。</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">第七条 您的权利</h2>
                <div className="space-y-3 text-white/90">
                  <p>7.1 <strong>访问权</strong>：您有权了解我们收集、使用您个人信息的情况。</p>
                  <p>7.2 <strong>更正权</strong>：当您发现个人信息有误时，您有权要求我们更正。</p>
                  <p>7.3 <strong>删除权</strong>：在特定情况下，您有权要求我们删除您的个人信息。</p>
                  <p>7.4 <strong>撤回同意</strong>：对于基于同意处理的个人信息，您有权随时撤回同意。</p>
                  <p>7.5 <strong>数据导出</strong>：您有权要求我们提供您的个人信息副本。</p>
                  <p>7.6 如需行使上述权利，请通过我们提供的联系方式与我们联系。</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">第八条 未成年人保护</h2>
                <div className="space-y-3 text-white/90">
                  <p>8.1 我们非常重视未成年人的个人信息保护。如果您是未成年人，请在监护人的陪同下阅读本隐私政策。</p>
                  <p>8.2 我们不会主动收集未成年人的个人信息。如果我们发现收集了未成年人的个人信息，会立即删除相关信息。</p>
                  <p>8.3 如果您是未成年人的监护人，对我们收集和使用未成年人个人信息有疑问，请及时与我们联系。</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">第九条 第三方服务</h2>
                <div className="space-y-3 text-white/90">
                  <p>9.1 我们的服务可能包含第三方链接或集成第三方服务（如微信登录、支付服务等）。</p>
                  <p>9.2 第三方服务有其独立的隐私政策，我们建议您仔细阅读相关政策。</p>
                  <p>9.3 我们对第三方的隐私保护措施不承担责任，但会要求合作伙伴保护用户隐私。</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">第十条 政策更新</h2>
                <div className="space-y-3 text-white/90">
                  <p>10.1 我们可能会不定期更新本隐私政策。更新后的政策将在我们的网站上公布。</p>
                  <p>10.2 如果更新涉及重大变更，我们会通过邮件、站内通知等方式告知您。</p>
                  <p>10.3 您继续使用我们的服务即表示同意更新后的隐私政策。</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">第十一条 联系我们</h2>
                <div className="space-y-3 text-white/90">
                  <p>11.1 如果您对本隐私政策有任何疑问、意见或建议，请通过以下方式联系我们：</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>服务提供者：个人开发者</li>
                    <li>联系邮箱：ravey_ai@163.com</li>
                  </ul>
                  <p>11.2 我们会在收到您的反馈后尽快回复并处理。</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">第十二条 法律适用</h2>
                <div className="space-y-3 text-white/90">
                  <p>12.1 本隐私政策的解释和执行适用中华人民共和国法律法规。</p>
                  <p>12.2 如因本隐私政策产生争议，双方应友好协商解决；协商不成的，可向有管辖权的人民法院提起诉讼。</p>
                </div>
              </section>

              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <p className="text-sm text-white/50">
                  本隐私政策自发布之日起生效。
                </p>
                <p className="text-sm text-white/50 mt-2">
                  服务提供者保留对本政策的最终解释权。
                </p>
              </div>
              
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}