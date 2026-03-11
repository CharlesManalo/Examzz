import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, BookOpen, Trophy, Target } from "lucide-react";
import QuizUpload from "@/components/QuizUpload";
import type { Quiz, Question, View } from "@/types";

const QuizGenerator = () => {
  const [activeTab, setActiveTab] = useState("generate");

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          AI Quiz Generator
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Transform your documents into interactive quizzes with the power of
          AI. Upload PDFs, Word documents, PowerPoint presentations, or Excel
          files.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="text-center">
          <CardHeader>
            <Brain className="h-8 w-8 mx-auto text-blue-500" />
            <CardTitle className="text-lg">AI-Powered</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Advanced Gemini AI analyzes your content and generates intelligent
              questions
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <BookOpen className="h-8 w-8 mx-auto text-green-500" />
            <CardTitle className="text-lg">Multiple Formats</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Support for PDFs, Word docs, PowerPoint slides, and Excel
              spreadsheets
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <Target className="h-8 w-8 mx-auto text-purple-500" />
            <CardTitle className="text-lg">Flexible Difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Choose from easy, medium, or hard questions to match your needs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generate Quiz</TabsTrigger>
          <TabsTrigger value="practice">Practice Mode</TabsTrigger>
          <TabsTrigger value="history">Quiz History</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <QuizUpload
            onStartQuiz={function (quiz: Quiz, questions: Question[]): void {
              throw new Error("Function not implemented.");
            }}
            onNavigate={function (view: View): void {
              throw new Error("Function not implemented.");
            }}
          />
        </TabsContent>

        <TabsContent value="practice" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Practice Mode</CardTitle>
              <CardDescription>
                Review previously generated quizzes or try sample questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <Trophy className="h-6 w-6 mb-2" />
                  <span>Sample Quiz</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <BookOpen className="h-6 w-6 mb-2" />
                  <span>Browse Library</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quiz History</CardTitle>
              <CardDescription>
                View your previously generated quizzes and results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No quiz history yet</p>
                <p className="text-sm">
                  Generate your first quiz to see it here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuizGenerator;
