import type { View } from "@/types";
import { Mail, Twitter, Github, Linkedin } from "lucide-react";

// Assets - temporarily using text logo instead of image

interface FooterProps {
  onNavigate: (view: View) => void;
}

const Footer = ({ onNavigate }: FooterProps) => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Product: [
      { label: "Features", action: () => onNavigate("home") },
      { label: "Pricing", action: () => {} },
      { label: "API", action: () => {} },
    ],
    Company: [
      { label: "About", action: () => {} },
      { label: "Blog", action: () => {} },
      { label: "Careers", action: () => {} },
    ],
    Resources: [
      { label: "Documentation", action: () => {} },
      { label: "Help Center", action: () => {} },
      { label: "Contact", action: () => {} },
    ],
    Legal: [
      { label: "Privacy", action: () => {} },
      { label: "Terms", action: () => {} },
      { label: "Cookie Policy", action: () => {} },
    ],
  };

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          <div className="col-span-2">
            <div
              className="flex items-center gap-2 mb-4 cursor-pointer"
              onClick={() => onNavigate("home")}
            >
              <span
                className="text-xl font-black text-black tracking-wider"
                style={{
                  fontFamily:
                    'Blanka, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
              >
                EXAMZZ
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Transform your study materials into interactive quizzes and exams.
              Learn smarter, not harder.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={link.action}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {currentYear} StudyQuiz Pro. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </button>
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </button>
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cookie Settings
            </button>
          </div>
        </div>
      </div>

      <div className="bg-muted py-4">
        <div className="container">
          <div className="flex items-center justify-center">
            <div className="bg-white/50 border-2 border-dashed border-muted-foreground/20 rounded-lg px-8 py-3">
              <p className="text-xs text-muted-foreground text-center">
                Advertisement Space - Google AdSense Ready
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
