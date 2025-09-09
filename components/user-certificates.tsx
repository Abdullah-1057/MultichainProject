'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, FileText, Loader2 } from 'lucide-react';
import { MotokoBackendService, type CertificateRecord } from '@/lib/motoko-backend-real';

export default function UserCertificates({ userAddress, className = '' }: { userAddress?: string; className?: string }) {
  const [items, setItems] = useState<CertificateRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!userAddress) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const motoko = MotokoBackendService.getInstance();
      const list = await motoko.getCertificatesByUser(userAddress);
      setItems(list.sort((a, b) => (b.issuedAt || 0) - (a.issuedAt || 0)));
    } catch (e: any) {
      setError(e?.message || 'Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddress]);

  const downloadPdf = (rec: CertificateRecord) => {
    try {
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${rec.pdfBase64}`;
      link.download = `certificate-${rec.verificationCode}.pdf`;
      link.click();
    } catch {}
  };

  return (
    <Card className={`bg-slate-800/70 border-slate-700 ${className}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="h-5 w-5" /> Certificates
        </CardTitle>
        <CardDescription className="text-slate-400">Certificates generated for your account</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4 border-red-500/40 bg-red-500/10">
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading certificates...
          </div>
        ) : items.length === 0 ? (
          <div className="text-slate-300 text-sm">No certificates yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-slate-300">Recipient</TableHead>
                  <TableHead className="text-slate-300">Course</TableHead>
                  <TableHead className="text-slate-300">Issued</TableHead>
                  <TableHead className="text-slate-300">Verification</TableHead>
                  <TableHead className="text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell className="text-slate-200">{rec.recipientName}</TableCell>
                    <TableCell className="text-slate-200">{rec.courseName}</TableCell>
                    <TableCell className="text-slate-200">{rec.issuedAt ? new Date(rec.issuedAt).toLocaleString() : '-'}</TableCell>
                    <TableCell className="text-slate-200 font-mono text-xs">{rec.verificationCode}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" className="border-slate-600 text-slate-200" onClick={() => downloadPdf(rec)}>
                        <Download className="h-3 w-3 mr-2" /> PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


