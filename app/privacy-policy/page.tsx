/* eslint-disable react/no-unescaped-entities */
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Gifta",
  description: "Learn about how Gifta collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-6 py-5 sm:py-6 lg:py-8">
      <header className="surface-mesh soft-shadow rounded-4xl border border-white/70 p-6 text-center sm:p-8 lg:p-10">
        <Badge variant="secondary" className="border-0 bg-white/80 text-slate-800">
          <ShieldCheck className="mr-1 h-3 w-3" />
          Legal
        </Badge>
        <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Privacy Policy</h1>
        <p className="mx-auto mt-3 max-w-3xl text-sm text-muted-foreground sm:text-base">
          Effective Date: March 8, 2026
        </p>
      </header>

      <Card className="glass-panel rounded-4xl border-white/60">
        <CardContent className="prose prose-slate max-w-none p-6 sm:p-8 lg:p-10">
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">1. Introduction</h2>
            <p className="mb-4 text-muted-foreground">
              Welcome to Gifta ({"we,"} {"our,"} or {"us"}). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our e-commerce platform for gifting products.
            </p>
            <p className="text-muted-foreground">
              By accessing or using Gifta, you agree to the terms outlined in this Privacy Policy. If you do not agree with our policies and practices, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">2. Information We Collect</h2>
            
            <h3 className="mb-3 text-xl font-semibold">2.1 Personal Information</h3>
            <p className="mb-4 text-muted-foreground">
              We collect personal information that you voluntarily provide to us when you:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Register for an account</li>
              <li>Place an order</li>
              <li>Subscribe to our newsletter</li>
              <li>Participate in surveys or promotions</li>
              <li>Contact customer support</li>
              <li>Write product reviews</li>
            </ul>
            <p className="mb-4 text-muted-foreground">This information may include:</p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Full name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Shipping and billing addresses</li>
              <li>Payment information (processed securely through our payment partners)</li>
              <li>Date of birth (for age verification)</li>
              <li>Profile preferences and wishlist items</li>
            </ul>

            <h3 className="mb-3 text-xl font-semibold">2.2 Automatically Collected Information</h3>
            <p className="mb-4 text-muted-foreground">
              When you access our platform, we automatically collect certain information about your device and browsing activity:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>IP address and geolocation data</li>
              <li>Browser type and version</li>
              <li>Device information (operating system, device identifiers)</li>
              <li>Pages viewed and time spent on pages</li>
              <li>Referral sources and clickstream data</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h3 className="mb-3 text-xl font-semibold">2.3 Information from Third Parties</h3>
            <p className="mb-4 text-muted-foreground">
              We may receive information about you from third-party vendors, delivery partners, payment processors, and social media platforms if you choose to connect your accounts or authorize such sharing.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">3. How We Use Your Information</h2>
            <p className="mb-4 text-muted-foreground">We use the collected information for the following purposes:</p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li><strong>Order Processing:</strong> To process and fulfill your orders, including payment processing, shipping, and delivery tracking</li>
              <li><strong>Customer Support:</strong> To respond to your inquiries, resolve disputes, and provide technical support</li>
              <li><strong>Account Management:</strong> To create and manage your account, including authentication and security</li>
              <li><strong>Personalization:</strong> To customize your shopping experience, recommend products, and display relevant content</li>
              <li><strong>Marketing Communications:</strong> To send promotional emails, newsletters, and special offers (with your consent)</li>
              <li><strong>Analytics and Improvement:</strong> To analyze usage patterns, improve our services, and develop new features</li>
              <li><strong>Fraud Prevention:</strong> To detect and prevent fraudulent transactions and unauthorized access</li>
              <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes</li>
              <li><strong>Business Operations:</strong> To manage vendor relationships, process returns, and handle disputes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">4. Information Sharing and Disclosure</h2>
            <p className="mb-4 text-muted-foreground">
              We do not sell your personal information to third parties. However, we may share your information in the following circumstances:
            </p>

            <h3 className="mb-3 text-xl font-semibold">4.1 Service Providers</h3>
            <p className="mb-4 text-muted-foreground">
              We share information with trusted third-party service providers who assist us in operating our platform, including:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Payment processors (Razorpay, etc.)</li>
              <li>Shipping and logistics partners (Delhivery, etc.)</li>
              <li>Cloud hosting and storage providers</li>
              <li>Email service providers</li>
              <li>Analytics and marketing platforms</li>
              <li>Customer support tools</li>
            </ul>

            <h3 className="mb-3 text-xl font-semibold">4.2 Vendors and Sellers</h3>
            <p className="mb-4 text-muted-foreground">
              When you place an order, we share relevant information (name, shipping address, phone number) with the vendors fulfilling your order.
            </p>

            <h3 className="mb-3 text-xl font-semibold">4.3 Legal Requirements</h3>
            <p className="mb-4 text-muted-foreground">
              We may disclose your information if required by law, court order, or governmental request, or to protect our rights, property, or safety.
            </p>

            <h3 className="mb-3 text-xl font-semibold">4.4 Business Transfers</h3>
            <p className="mb-4 text-muted-foreground">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">5. Cookies and Tracking Technologies</h2>
            <p className="mb-4 text-muted-foreground">
              We use cookies, web beacons, and similar technologies to enhance your experience and collect usage data. Cookies are small text files stored on your device that help us:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Remember your preferences and settings</li>
              <li>Keep you signed in to your account</li>
              <li>Understand how you interact with our platform</li>
              <li>Deliver personalized content and advertisements</li>
              <li>Analyze traffic and usage patterns</li>
            </ul>
            <p className="mb-4 text-muted-foreground">
              You can manage cookie preferences through your browser settings. However, disabling cookies may limit certain features of our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">6. Data Security</h2>
            <p className="mb-4 text-muted-foreground">
              We implement industry-standard security measures to protect your personal information, including:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>SSL/TLS encryption for data transmission</li>
              <li>Secure payment processing through PCI-DSS compliant providers</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Data encryption at rest and in transit</li>
              <li>Regular backups and disaster recovery procedures</li>
            </ul>
            <p className="text-muted-foreground">
              While we strive to protect your data, no method of transmission over the internet is 100% secure. You are responsible for maintaining the confidentiality of your account credentials.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">7. Your Rights and Choices</h2>
            <p className="mb-4 text-muted-foreground">You have the following rights regarding your personal information:</p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Update or correct inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal obligations)</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications at any time</li>
              <li><strong>Data Portability:</strong> Request your data in a structured, machine-readable format</li>
              <li><strong>Objection:</strong> Object to certain processing activities, such as direct marketing</li>
              <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
            </ul>
            <p className="text-muted-foreground">
              To exercise these rights, please contact us at <a href="mailto:privacy@gifta.com" className="text-primary hover:underline">privacy@gifta.com</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">8. Data Retention</h2>
            <p className="mb-4 text-muted-foreground">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law. When information is no longer needed, we securely delete or anonymize it.
            </p>
            <p className="text-muted-foreground">
              Account information is retained until you request deletion. Transaction records are retained for at least 7 years to comply with tax and accounting regulations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">9. Children's Privacy</h2>
            <p className="mb-4 text-muted-foreground">
              Our platform is not intended for users under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child without parental consent, we will take steps to delete that information promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">10. Third-Party Links</h2>
            <p className="mb-4 text-muted-foreground">
              Our platform may contain links to third-party websites, social media platforms, or services. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing any personal information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">11. International Data Transfers</h2>
            <p className="mb-4 text-muted-foreground">
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">12. Changes to This Privacy Policy</h2>
            <p className="mb-4 text-muted-foreground">
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of material changes by posting the updated policy on our platform and updating the {"\"Effective Date\""} at the top of this page.
            </p>
            <p className="text-muted-foreground">
              Your continued use of our services after any changes indicates your acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">13. Contact Us</h2>
            <p className="mb-4 text-muted-foreground">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="rounded-2xl bg-[#fff3ea] p-4 text-sm text-muted-foreground">
              <p className="mb-2"><strong>Email:</strong> <a href="mailto:privacy@gifta.com" className="text-primary hover:underline">privacy@gifta.com</a></p>
              <p className="mb-2"><strong>Support:</strong> <a href="mailto:support@gifta.com" className="text-primary hover:underline">support@gifta.com</a></p>
              <p className="mb-2"><strong>Phone:</strong> +91 1800-XXX-XXXX (Mon-Sat, 9 AM - 6 PM IST)</p>
              <p><strong>Address:</strong> Gifta Technologies Pvt Ltd, 123 Business Park, Bengaluru, Karnataka, India 560001</p>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">14. Governing Law</h2>
            <p className="text-muted-foreground">
              This Privacy Policy is governed by and construed in accordance with the laws of India. Any disputes arising from this Privacy Policy or your use of our services shall be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka, India.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
