import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, Download, Trash2, FileText, Search } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Document {
  id: string;
  title: string;
  description?: string;
  category: string;
  filename: string;
  file_size: number;
  uploaded_by_email?: string;
  uploaded_at: string;
  tags?: string;
}

const CATEGORIES = {
  policy: 'Politike',
  procedure: 'Postopki',
  certificate: 'Certifikati',
  contract: 'Pogodbe',
  audit_report: 'Revizijska poročila',
  risk_assessment: 'Ocene tveganj',
  network_diagram: 'Omrežne sheme',
  log: 'Dnevniki',
  other: 'Ostalo',
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadProgress, setUploadProgress] = useState(false);
  const [error, setError] = useState('');

  // Upload form state
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    loadDocuments();
  }, [filterCategory, searchTerm]);

  const loadDocuments = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const params: any = {};
      if (filterCategory) params.category = filterCategory;
      if (searchTerm) params.search = searchTerm;

      const response = await axios.get(`${API_BASE_URL}/api/v1/documents`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !category) {
      setError('Prosim izpolnite vsa obvezna polja');
      return;
    }

    setUploadProgress(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('category', category);
      if (description) formData.append('description', description);
      if (tags) formData.append('tags', tags);

      await axios.post(`${API_BASE_URL}/api/v1/documents`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      // Reset form
      setFile(null);
      setTitle('');
      setDescription('');
      setCategory('');
      setTags('');
      setUploadDialogOpen(false);
      
      // Reload documents
      loadDocuments();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Napaka pri nalaganju datoteke');
    } finally {
      setUploadProgress(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/documents/${doc.id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download document:', error);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Ali ste prepričani, da želite izbrisati ta dokument?')) return;

    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${API_BASE_URL}/api/v1/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      loadDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Layout>
      <div className="p-8 bg-gray-50 min-h-full">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Knjižnica dokumentov</h1>
              <p className="text-muted-foreground">
                Naložite in upravljajte dokumente za vašo organizacijo
              </p>
            </div>
            
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Naloži dokument
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Naloži nov dokument</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpload} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div>
                    <Label htmlFor="file">Datoteka *</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="title">Naslov *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Kategorija *</Label>
                    <select
                      id="category"
                      className="w-full px-3 py-2 border rounded-md"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                    >
                      <option value="">Izberite kategorijo</option>
                      {Object.entries(CATEGORIES).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="description">Opis</Label>
                    <textarea
                      id="description"
                      className="w-full min-h-[80px] px-3 py-2 border rounded-md"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="tags">Oznake (ločene z vejico)</Label>
                    <Input
                      id="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="npr: ISO27001, GDPR, Varnost"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={uploadProgress}>
                      {uploadProgress ? 'Nalaganje...' : 'Naloži'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setUploadDialogOpen(false)}
                    >
                      Prekliči
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Iskanje po naslovu, opisu, datoteki..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-48">
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="">Vse kategorije</option>
                    {Object.entries(CATEGORIES).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents list */}
          {loading ? (
            <p>Nalaganje...</p>
          ) : documents.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-muted-foreground">Ni dokumentov</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <h3 className="font-semibold">{doc.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                                {CATEGORIES[doc.category as keyof typeof CATEGORIES]}
                              </span>
                              <span>•</span>
                              <span>{doc.filename}</span>
                              <span>•</span>
                              <span>{formatFileSize(doc.file_size)}</span>
                              {doc.uploaded_by_email && (
                                <>
                                  <span>•</span>
                                  <span>{doc.uploaded_by_email}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>{new Date(doc.uploaded_at).toLocaleDateString('sl-SI')}</span>
                            </div>
                            {doc.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {doc.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(doc.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
