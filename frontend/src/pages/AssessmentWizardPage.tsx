import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { questionsAPI, assessmentsAPI } from '@/lib/api';

interface Domain {
  code: string;
  name: string;
  question_count: number;
}

interface Question {
  code: string;
  domain: string;
  text: string;
}

interface Answer {
  domain: string;
  question_code: string;
  score: number;
  note: string;
}

export default function AssessmentWizardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [domains, setDomains] = useState<Domain[]>([]);
  const [currentDomainIndex, setCurrentDomainIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [loading, setLoading] = useState(false);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

  useEffect(() => {
    loadDomains();
  }, []);

  useEffect(() => {
    if (domains.length > 0) {
      loadQuestions(domains[currentDomainIndex].code);
    }
  }, [currentDomainIndex, domains]);

  const loadDomains = async () => {
    try {
      const { data } = await questionsAPI.getDomains();
      setDomains(data);
    } catch (error) {
      console.error('Failed to load domains:', error);
    }
  };

  const loadQuestions = async (domain: string) => {
    try {
      // Build answers map for current domain only (question_code -> score)
      const domainAnswers: Record<string, number> = {};
      Object.entries(answers).forEach(([code, answer]) => {
        if (answer.domain === domain && answer.score !== undefined) {
          domainAnswers[code] = answer.score;
        }
      });

      // Use filtered endpoint if we have answers, otherwise use base endpoint
      let data;
      if (Object.keys(domainAnswers).length > 0) {
        const response = await questionsAPI.getFiltered(domain, domainAnswers);
        data = response.data;
      } else {
        const response = await questionsAPI.getByDomain(domain);
        data = response.data;
      }

      setQuestions(data);
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  };

  const handleScoreChange = (questionCode: string, score: number) => {
    const question = questions.find((q) => q.code === questionCode);
    if (!question) return;

    setAnswers((prev) => ({
      ...prev,
      [questionCode]: {
        domain: question.domain,
        question_code: questionCode,
        score,
        note: prev[questionCode]?.note || '',
      },
    }));

    // Reload questions to show/hide branching questions
    setTimeout(() => {
      if (domains.length > 0) {
        loadQuestions(domains[currentDomainIndex].code);
      }
    }, 100);
  };

  const handleNoteChange = (questionCode: string, note: string) => {
    const question = questions.find((q) => q.code === questionCode);
    if (!question) return;

    setAnswers((prev) => ({
      ...prev,
      [questionCode]: {
        domain: question.domain,
        question_code: questionCode,
        score: prev[questionCode]?.score || 0,
        note,
      },
    }));
  };

  const handleNext = async () => {
    if (currentDomainIndex < domains.length - 1) {
      setCurrentDomainIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentDomainIndex > 0) {
      setCurrentDomainIndex((prev) => prev - 1);
    }
  };

  const handleSaveDraft = async () => {
    if (!user?.org_id) return;

    setLoading(true);
    try {
      // Create assessment if not exists
      let id = assessmentId;
      if (!id) {
        const { data } = await assessmentsAPI.create(user.org_id, { version: 1 });
        id = data.id;
        setAssessmentId(id);
      }

      // Save answers
      if (id) {
        await assessmentsAPI.saveAnswers(id, Object.values(answers));
        alert('Osnutek shranjen!');
      }
    } catch (error: any) {
      alert('Napaka pri shranjevanju: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!user?.org_id) {
      console.log('No org_id found');
      return;
    }

    // Check if all questions in current domain are answered
    const currentDomainAnswered = questions.every((q) => answers[q.code]?.score !== undefined);
    if (!currentDomainAnswered) {
      alert('Prosim odgovorite na vsa vprašanja v tej domeni.');
      return;
    }

    // Check if we have at least some answers
    const totalAnswers = Object.keys(answers).length;
    console.log(`Total answers: ${totalAnswers}`);
    
    if (totalAnswers === 0) {
      alert('Prosim odgovorite vsaj na nekaj vprašanj.');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting finalization...');
      
      // Create assessment if not exists
      let id = assessmentId;
      if (!id) {
        console.log('Creating new assessment...');
        const { data } = await assessmentsAPI.create(user.org_id, { version: 1 });
        id = data.id;
        setAssessmentId(id);
        console.log(`Assessment created: ${id}`);
      }

      // Save all answers
      if (!id) {
        console.log('ERROR: No assessment ID');
        return;
      }
      
      console.log(`Saving ${Object.values(answers).length} answers...`);
      await assessmentsAPI.saveAnswers(id, Object.values(answers));
      console.log('Answers saved');

      // Finalize
      console.log('Finalizing assessment...');
      await assessmentsAPI.finalize(id);
      console.log('Assessment finalized');

      alert('Ocenjevanje zaključeno! Rezultati so vidni na dashboardu.');
      // Force dashboard reload by adding timestamp
      navigate('/dashboard?reload=' + Date.now());
    } catch (error: any) {
      console.error('Finalization error:', error);
      alert('Napaka pri zaključku: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (domains.length === 0) {
    return <div className="min-h-screen flex items-center justify-center">Nalaganje...</div>;
  }

  const currentDomain = domains[currentDomainIndex];
  const progress = ((currentDomainIndex + 1) / domains.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-primary">Nova ocena kibernetske zrelosti</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">
              Domena {currentDomainIndex + 1} od {domains.length}: {currentDomain.name}
            </span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{currentDomain.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ocenite vsako trditev na lestvici 0-5 (0 = ni implementirano, 5 = optimizirano)
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {questions.map((question, idx) => {
                const answer = answers[question.code];
                return (
                  <div key={question.code} className="border-b pb-6 last:border-b-0">
                    <p className="font-medium mb-3">
                      {idx + 1}. {question.text}
                    </p>

                    {/* Likert scale */}
                    <div className="flex gap-2 mb-3">
                      {[0, 1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          onClick={() => handleScoreChange(question.code, score)}
                          className={`
                            w-12 h-12 rounded border-2 font-semibold transition-colors
                            ${
                              answer?.score === score
                                ? 'border-primary bg-primary text-white'
                                : 'border-gray-300 hover:border-primary'
                            }
                          `}
                        >
                          {score}
                        </button>
                      ))}
                    </div>

                    {/* Note */}
                    <textarea
                      value={answer?.note || ''}
                      onChange={(e) => handleNoteChange(question.code, e.target.value)}
                      placeholder="Opomba (opcijsko)"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      rows={2}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-6">
          <Button
            onClick={handleBack}
            variant="outline"
            disabled={currentDomainIndex === 0 || loading}
          >
            ← Nazaj
          </Button>

          <div className="flex gap-3">
            <Button onClick={handleSaveDraft} variant="secondary" disabled={loading}>
              Shrani osnutek
            </Button>

            {currentDomainIndex < domains.length - 1 ? (
              <Button onClick={handleNext} disabled={loading}>
                Naprej →
              </Button>
            ) : (
              <>
                <Button 
                  onClick={() => {
                    alert('TEST GUMB - Ali vidiš to?');
                    console.log('=== FINALIZE BUTTON CLICKED ===');
                    console.log('Loading state:', loading);
                    console.log('Current domain index:', currentDomainIndex);
                    console.log('Total domains:', domains.length);
                    console.log('Answers count:', Object.keys(answers).length);
                    handleFinalize();
                  }} 
                  disabled={loading}
                >
                  Zaključi oceno
                </Button>
                
                {/* Debug info */}
                <div className="text-xs text-gray-500 ml-2">
                  Loading: {loading ? 'Yes' : 'No'} | Answers: {Object.keys(answers).length}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
