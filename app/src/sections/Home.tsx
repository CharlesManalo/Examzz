import type { View } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  FileText,
  Brain,
  Trophy,
  Clock,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Zap,
  Target,
} from "lucide-react";

interface HomeProps {
  onNavigate: (view: View) => void;
  isAuthenticated: boolean;
}

const Home = ({ onNavigate, isAuthenticated }: HomeProps) => {
  const features = [
    {
      icon: Upload,
      title: "Upload Any Document",
      description:
        "Support for PDF, Word, PowerPoint, and Excel files. Drag and drop up to 15 files at once.",
    },
    {
      icon: Brain,
      title: "Smart Quiz Generation",
      description:
        "Our rule-based system automatically creates quizzes from your study materials.",
    },
    {
      icon: Trophy,
      title: "Kahoot-Style Exams",
      description:
        "Interactive exam interface with timers, progress bars, and instant feedback.",
    },
    {
      icon: Clock,
      title: "Track Your Progress",
      description:
        "Monitor your learning journey with detailed analytics and performance insights.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Upload Materials",
      description: "Drag and drop your study documents",
    },
    {
      number: "02",
      title: "Generate Quiz",
      description: "Our system creates questions automatically",
    },
    {
      number: "03",
      title: "Practice & Learn",
      description: "Take interactive quizzes and track progress",
    },
  ];

  const stats = [
    { value: "10K+", label: "Active Students" },
    { value: "50K+", label: "Quizzes Generated" },
    { value: "95%", label: "Success Rate" },
    { value: "4.9", label: "User Rating" },
  ];

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-gradient-to-b from-violet-50 via-white to-white py-20 lg:py-32">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-violet-400 opacity-20 blur-[100px]"></div>

        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 w-fit">
                <Sparkles className="h-4 w-4 text-violet-600" />
                <span className="text-sm font-medium text-violet-700">
                  AI-Powered Learning
                </span>
              </div>

              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
                Turn Your{" "}
                <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  Study Materials
                </span>{" "}
                Into Interactive Quizzes
              </h1>

              <p className="text-lg text-muted-foreground max-w-xl">
                Upload your documents and automatically generate quizzes, mock
                exams, and lesson reviews. Study smarter with our Kahoot-style
                exam interface.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={() =>
                    onNavigate(isAuthenticated ? "upload" : "register")
                  }
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-lg px-8"
                >
                  {isAuthenticated ? "Upload Documents" : "Get Started Free"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => onNavigate("login")}
                  className={isAuthenticated ? "hidden" : ""}
                >
                  Sign In
                </Button>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Free plan available</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-2xl border bg-white p-2 shadow-2xl">
                <div className="rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-violet-600 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Biology_Chapter_3.pdf</p>
                        <p className="text-sm text-muted-foreground">2.4 MB</p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">History_Notes.docx</p>
                        <p className="text-sm text-muted-foreground">1.8 MB</p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                    </div>
                    <div className="h-2 bg-white rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full"></div>
                    </div>
                    <p className="text-sm text-center text-muted-foreground">
                      Generating quiz...
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 border">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-medium">85% Score!</span>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 border">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-violet-500" />
                  <span className="text-sm font-medium">
                    10 Questions Ready
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 border-y bg-muted/50">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-32">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Study Smarter
              </span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Our platform provides all the tools you need to transform your
              study materials into effective learning experiences.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-6 w-6 text-violet-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-32 bg-gradient-to-b from-violet-50 to-white">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              How It{" "}
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Works
              </span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-bold text-violet-100 mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-violet-200 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-32">
        <div className="container">
          <div className="relative rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 p-8 lg:p-16 overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-white opacity-10 blur-3xl"></div>
            <div className="absolute left-0 bottom-0 h-64 w-64 rounded-full bg-white opacity-10 blur-3xl"></div>

            <div className="relative text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 mb-6">
                <Target className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white">
                  Start Learning Today
                </span>
              </div>

              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Study Experience?
              </h2>
              <p className="text-violet-100 text-lg mb-8">
                Join thousands of students who are already studying smarter with
                Examzz.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() =>
                    onNavigate(isAuthenticated ? "upload" : "register")
                  }
                  className="bg-white text-violet-600 hover:bg-violet-50 text-lg px-8"
                >
                  {isAuthenticated ? "Upload Documents" : "Get Started Free"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
