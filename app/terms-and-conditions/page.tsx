/* eslint-disable react/no-unescaped-entities */
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

export const metadata = {
  title: "Terms and Conditions | Gifta",
  description: "Read the terms and conditions governing your use of the Gifta platform.",
};

export default function TermsAndConditionsPage() {
  return (
    <div className="space-y-6 py-5 sm:py-6 lg:py-8">
      <header className="surface-mesh soft-shadow rounded-4xl border border-white/70 p-6 text-center sm:p-8 lg:p-10">
        <Badge variant="secondary" className="border-0 bg-white/80 text-slate-800">
          <FileText className="mr-1 h-3 w-3" />
          Legal
        </Badge>
        <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Terms and Conditions</h1>
        <p className="mx-auto mt-3 max-w-3xl text-sm text-muted-foreground sm:text-base">
          Effective Date: March 8, 2026
        </p>
      </header>

      <Card className="glass-panel rounded-4xl border-white/60">
        <CardContent className="prose prose-slate max-w-none p-6 sm:p-8 lg:p-10">
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">1. Agreement to Terms</h2>
            <p className="mb-4 text-muted-foreground">
              Welcome to Gifta. These Terms and Conditions ({"\"Terms\""}) constitute a legally binding agreement between you and Gifta Technologies Pvt Ltd ({"\"Gifta,\""} {"\"we,\""} {"\"our,\""} or {"\"us\""}), governing your access to and use of our e-commerce platform, including our website, mobile applications, and related services (collectively, the {"\"Platform\""}).
            </p>
            <p className="mb-4 text-muted-foreground">
              By accessing or using our Platform, you agree to be bound by these Terms and our Privacy Policy. If you do not agree with any part of these Terms, you must not use our Platform.
            </p>
            <p className="text-muted-foreground">
              We reserve the right to modify these Terms at any time. Your continued use of the Platform after changes are posted constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">2. Eligibility</h2>
            <p className="mb-4 text-muted-foreground">
              To use our Platform, you must:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Be at least 18 years of age or have parental/guardian consent</li>
              <li>Have the legal capacity to enter into binding contracts</li>
              <li>Not be prohibited from using the Platform under applicable laws</li>
              <li>Reside in a location where our services are available</li>
              <li>Provide accurate and complete registration information</li>
            </ul>
            <p className="text-muted-foreground">
              By creating an account, you represent and warrant that you meet these eligibility requirements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">3. Account Registration and Security</h2>
            
            <h3 className="mb-3 text-xl font-semibold">3.1 Account Creation</h3>
            <p className="mb-4 text-muted-foreground">
              To access certain features of the Platform, you must create an account. You agree to:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Notify us immediately of any unauthorized access or security breach</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h3 className="mb-3 text-xl font-semibold">3.2 Account Termination</h3>
            <p className="mb-4 text-muted-foreground">
              We reserve the right to suspend or terminate your account at any time for violations of these Terms, fraudulent activity, or any other reason at our sole discretion. You may also close your account at any time by contacting customer support.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">4. Use of the Platform</h2>
            
            <h3 className="mb-3 text-xl font-semibold">4.1 Permitted Use</h3>
            <p className="mb-4 text-muted-foreground">
              You may use the Platform to browse products, place orders, manage your account, and access related services in accordance with these Terms.
            </p>

            <h3 className="mb-3 text-xl font-semibold">4.2 Prohibited Activities</h3>
            <p className="mb-4 text-muted-foreground">
              You agree not to:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Use the Platform for any illegal or unauthorized purpose</li>
              <li>Violate any applicable laws, regulations, or third-party rights</li>
              <li>Impersonate any person or entity or falsely claim affiliation</li>
              <li>Transmit viruses, malware, or other harmful code</li>
              <li>Attempt to gain unauthorized access to our systems or networks</li>
              <li>Scrape, crawl, or use automated tools to access the Platform without permission</li>
              <li>Interfere with or disrupt the Platform's operation or security</li>
              <li>Post false, misleading, or defamatory content</li>
              <li>Harass, abuse, or harm other users or vendors</li>
              <li>Use the Platform to distribute spam or unsolicited communications</li>
              <li>Create multiple accounts to abuse promotions or manipulate the system</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Platform</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">5. Orders and Transactions</h2>
            
            <h3 className="mb-3 text-xl font-semibold">5.1 Placing Orders</h3>
            <p className="mb-4 text-muted-foreground">
              When you place an order, you are making an offer to purchase the products listed in your cart. Your order is subject to acceptance by us and the respective vendors. We reserve the right to refuse or cancel any order for reasons including but not limited to:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Product unavailability</li>
              <li>Pricing or description errors</li>
              <li>Suspected fraudulent activity</li>
              <li>Delivery restrictions or limitations</li>
              <li>Violations of these Terms</li>
            </ul>

            <h3 className="mb-3 text-xl font-semibold">5.2 Order Confirmation</h3>
            <p className="mb-4 text-muted-foreground">
              After placing an order, you will receive an order confirmation email. This confirmation does not constitute acceptance of your order; it is merely an acknowledgment that we have received it. A contract is formed only when we dispatch the products or when vendors confirm fulfillment.
            </p>

            <h3 className="mb-3 text-xl font-semibold">5.3 Pricing and Payment</h3>
            <p className="mb-4 text-muted-foreground">
              All prices are listed in Indian Rupees (INR) and include applicable taxes unless otherwise stated. Prices are subject to change without notice. We accept payment through the methods specified on the Platform, including:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Credit/Debit cards</li>
              <li>Net banking</li>
              <li>UPI and digital wallets</li>
              <li>Cash on Delivery (where available)</li>
            </ul>
            <p className="mb-4 text-muted-foreground">
              Payment information is processed securely through third-party payment processors. We do not store your complete card details.
            </p>

            <h3 className="mb-3 text-xl font-semibold">5.4 Promotional Codes</h3>
            <p className="mb-4 text-muted-foreground">
              Promotional codes and discounts are subject to specific terms and conditions. They cannot be combined with other offers unless explicitly stated. We reserve the right to modify or cancel promotions at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">6. Shipping and Delivery</h2>
            
            <h3 className="mb-3 text-xl font-semibold">6.1 Delivery Areas</h3>
            <p className="mb-4 text-muted-foreground">
              We deliver to locations across India subject to serviceability. Delivery times vary based on your location, product availability, and vendor fulfillment capacity.
            </p>

            <h3 className="mb-3 text-xl font-semibold">6.2 Shipping Charges</h3>
            <p className="mb-4 text-muted-foreground">
              Shipping charges are calculated based on order value, delivery location, and product dimensions. Free shipping may be available for orders above certain thresholds.
            </p>

            <h3 className="mb-3 text-xl font-semibold">6.3 Delivery Timeline</h3>
            <p className="mb-4 text-muted-foreground">
              Estimated delivery times are provided at checkout and in order confirmation emails. These are estimates and not guarantees. Delays may occur due to unforeseen circumstances including weather, public holidays, or logistical challenges.
            </p>

            <h3 className="mb-3 text-xl font-semibold">6.4 Risk of Loss</h3>
            <p className="mb-4 text-muted-foreground">
              Title and risk of loss pass to you upon delivery to your specified address. You are responsible for inspecting products upon delivery and reporting any damage or discrepancies immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">7. Returns, Refunds, and Cancellations</h2>
            
            <h3 className="mb-3 text-xl font-semibold">7.1 Cancellation Policy</h3>
            <p className="mb-4 text-muted-foreground">
              You may cancel your order before it is dispatched by the vendor. Orders cannot be cancelled once they are shipped. To cancel an order, contact customer support or use the cancellation option in your account.
            </p>

            <h3 className="mb-3 text-xl font-semibold">7.2 Return Policy</h3>
            <p className="mb-4 text-muted-foreground">
              We accept returns within 7 days of delivery for eligible products. To be eligible for a return:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Products must be unused, undamaged, and in original packaging</li>
              <li>Tags and labels must remain intact</li>
              <li>Return must be initiated within 7 days of delivery</li>
              <li>Proof of purchase (order confirmation) must be provided</li>
            </ul>
            <p className="mb-4 text-muted-foreground">
              The following products are not eligible for return:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Personalized or customized items</li>
              <li>Perishable goods (flowers, cakes, food items)</li>
              <li>Intimate or sanitary products</li>
              <li>Products marked as non-returnable</li>
            </ul>

            <h3 className="mb-3 text-xl font-semibold">7.3 Refund Policy</h3>
            <p className="mb-4 text-muted-foreground">
              Refunds will be processed within 7-10 business days after we receive and inspect the returned product. Refunds will be credited to the original payment method. Shipping charges are non-refundable unless the return is due to our error or a defective product.
            </p>

            <h3 className="mb-3 text-xl font-semibold">7.4 Damaged or Defective Products</h3>
            <p className="mb-4 text-muted-foreground">
              If you receive a damaged or defective product, please contact us within 48 hours of delivery with photos and order details. We will arrange for a replacement or full refund at no additional cost to you.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">8. Intellectual Property Rights</h2>
            
            <h3 className="mb-3 text-xl font-semibold">8.1 Platform Content</h3>
            <p className="mb-4 text-muted-foreground">
              All content on the Platform, including text, graphics, logos, images, videos, software, and design elements, is owned by Gifta or licensed to us and is protected by copyright, trademark, and other intellectual property laws.
            </p>

            <h3 className="mb-3 text-xl font-semibold">8.2 Limited License</h3>
            <p className="mb-4 text-muted-foreground">
              We grant you a limited, non-exclusive, non-transferable license to access and use the Platform for personal, non-commercial purposes. You may not reproduce, distribute, modify, or create derivative works from any Platform content without our prior written consent.
            </p>

            <h3 className="mb-3 text-xl font-semibold">8.3 User Content</h3>
            <p className="mb-4 text-muted-foreground">
              By submitting reviews, comments, photos, or other content to the Platform, you grant us a worldwide, perpetual, royalty-free license to use, reproduce, modify, and display such content for business purposes. You represent that you own or have the necessary rights to grant this license.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">9. Third-Party Vendors and Marketplace</h2>
            <p className="mb-4 text-muted-foreground">
              Gifta operates as a multi-vendor marketplace. While we strive to ensure quality and reliability, we are not the seller of products listed by third-party vendors. Each vendor is an independent entity responsible for:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Product descriptions, accuracy, and quality</li>
              <li>Order fulfillment and shipping</li>
              <li>Customer service for vendor-specific issues</li>
              <li>Compliance with applicable laws and regulations</li>
            </ul>
            <p className="text-muted-foreground">
              We act as a facilitator and are not liable for vendor performance, product quality, or disputes between you and vendors, except as required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">10. Disclaimers and Limitations of Liability</h2>
            
            <h3 className="mb-3 text-xl font-semibold">10.1 Platform {"\"As Is\""}</h3>
            <p className="mb-4 text-muted-foreground">
              The Platform is provided on an {"\"as is\""} and {"\"as available\""} basis without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
            </p>

            <h3 className="mb-3 text-xl font-semibold">10.2 No Guarantee of Availability</h3>
            <p className="mb-4 text-muted-foreground">
              We do not guarantee that the Platform will be available, uninterrupted, secure, or error-free. We may suspend or discontinue the Platform at any time without notice.
            </p>

            <h3 className="mb-3 text-xl font-semibold">10.3 Limitation of Liability</h3>
            <p className="mb-4 text-muted-foreground">
              To the maximum extent permitted by law, Gifta and its affiliates, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform, including but not limited to:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Loss of profits or revenue</li>
              <li>Loss of data or business opportunities</li>
              <li>Product defects or delays in delivery</li>
              <li>Unauthorized access to your account</li>
              <li>Errors or inaccuracies in product information</li>
            </ul>
            <p className="mb-4 text-muted-foreground">
              Our total liability for any claims related to the Platform shall not exceed the amount you paid for the specific product or service giving rise to the claim, or ₹5,000, whichever is lower.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">11. Indemnification</h2>
            <p className="mb-4 text-muted-foreground">
              You agree to indemnify, defend, and hold harmless Gifta, its affiliates, and their respective officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses (including legal fees) arising from:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
              <li>Your violation of these Terms</li>
              <li>Your use or misuse of the Platform</li>
              <li>Your violation of any third-party rights</li>
              <li>Content you submit to the Platform</li>
              <li>Fraudulent or illegal activities</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">12. Dispute Resolution and Governing Law</h2>
            
            <h3 className="mb-3 text-xl font-semibold">12.1 Governing Law</h3>
            <p className="mb-4 text-muted-foreground">
              These Terms are governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka, India.
            </p>

            <h3 className="mb-3 text-xl font-semibold">12.2 Dispute Resolution</h3>
            <p className="mb-4 text-muted-foreground">
              In the event of any dispute, you agree to first attempt to resolve the matter informally by contacting our customer support. If the dispute cannot be resolved within 30 days, either party may pursue legal remedies.
            </p>

            <h3 className="mb-3 text-xl font-semibold">12.3 Arbitration</h3>
            <p className="mb-4 text-muted-foreground">
              Any dispute not resolved through informal negotiation may be submitted to binding arbitration in accordance with the Arbitration and Conciliation Act, 1996. Arbitration shall be conducted in Bengaluru, Karnataka, India.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">13. Force Majeure</h2>
            <p className="mb-4 text-muted-foreground">
              We shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, including but not limited to acts of God, natural disasters, war, terrorism, labor strikes, government actions, pandemics, or technical failures.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">14. Severability</h2>
            <p className="mb-4 text-muted-foreground">
              If any provision of these Terms is found to be invalid or unenforceable by a court of competent jurisdiction, the remaining provisions shall remain in full force and effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">15. Entire Agreement</h2>
            <p className="mb-4 text-muted-foreground">
              These Terms, together with our Privacy Policy and any additional terms applicable to specific services, constitute the entire agreement between you and Gifta regarding the use of the Platform and supersede all prior agreements and understandings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">16. Contact Information</h2>
            <p className="mb-4 text-muted-foreground">
              If you have any questions or concerns about these Terms, please contact us:
            </p>
            <div className="rounded-2xl bg-[#fff3ea] p-4 text-sm text-muted-foreground">
              <p className="mb-2"><strong>Email:</strong> <a href="mailto:legal@gifta.com" className="text-primary hover:underline">legal@gifta.com</a></p>
              <p className="mb-2"><strong>Support:</strong> <a href="mailto:support@gifta.com" className="text-primary hover:underline">support@gifta.com</a></p>
              <p className="mb-2"><strong>Phone:</strong> +91 1800-XXX-XXXX (Mon-Sat, 9 AM - 6 PM IST)</p>
              <p><strong>Address:</strong> Gifta Technologies Pvt Ltd, 123 Business Park, Bengaluru, Karnataka, India 560001</p>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">17. Acknowledgment</h2>
            <p className="text-muted-foreground">
              By using the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree, please discontinue use of the Platform immediately.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
