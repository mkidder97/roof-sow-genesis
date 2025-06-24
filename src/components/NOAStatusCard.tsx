
import React from 'react';
import { FileText, Download, CheckCircle, AlertTriangle, ExternalLink, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ApprovalDocument {
  title: string;
  url: string;
}

interface ApprovalData {
  noaNumber?: string;
  windRating?: number;
  hvhzApproved?: boolean;
  expirationDate?: string;
  documents?: ApprovalDocument[];
  approvalNumbers?: string[];
}

interface NOAStatusCardProps {
  approvalData: ApprovalData;
  className?: string;
  compact?: boolean;
}

const NOAStatusCard: React.FC<NOAStatusCardProps> = ({ 
  approvalData, 
  className = '',
  compact = false 
}) => {
  const {
    noaNumber,
    windRating,
    hvhzApproved = false,
    expirationDate,
    documents = [],
    approvalNumbers = []
  } = approvalData;

  // Check if we have any approval data
  const hasApprovalData = noaNumber || approvalNumbers.length > 0 || windRating;
  
  // Get primary NOA number
  const primaryNOA = noaNumber || approvalNumbers[0];
  
  // Check if expired
  const isExpired = expirationDate ? new Date(expirationDate) < new Date() : false;
  const isExpiringSoon = expirationDate ? 
    new Date(expirationDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : false;

  if (!hasApprovalData) {
    return (
      <Card className={`border-gray-200 bg-gray-50/50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-gray-500">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">No approval data available</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-blue-200 bg-white/80 backdrop-blur-sm ${className}`}>
      <CardHeader className={`pb-3 ${compact ? 'p-3' : ''}`}>
        <CardTitle className={`flex items-center gap-2 ${compact ? 'text-sm' : 'text-base'}`}>
          <FileText className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600`} />
          <span>NOA Status</span>
          {hvhzApproved ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className={`space-y-4 ${compact ? 'p-3 pt-0' : 'pt-0'}`}>
        {/* NOA Information */}
        <div className="space-y-2">
          {primaryNOA && (
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                NOA Number
              </p>
              <p className={`font-mono text-blue-700 ${compact ? 'text-sm' : 'text-base'}`}>
                {primaryNOA}
              </p>
            </div>
          )}

          {/* Additional Approval Numbers */}
          {approvalNumbers.length > 1 && (
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Additional Approvals
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {approvalNumbers.slice(1).map((approval, index) => (
                  <Badge key={index} variant="outline" className="text-xs font-mono">
                    {approval}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={hvhzApproved ? "default" : "secondary"}
              className={hvhzApproved ? "bg-green-600" : "bg-gray-500"}
            >
              {hvhzApproved ? 'HVHZ Approved' : 'Standard Approval'}
            </Badge>
            
            {windRating && (
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                {windRating} psf wind rating
              </Badge>
            )}
          </div>
        </div>

        {/* Expiration Information */}
        {expirationDate && (
          <div className={`p-3 rounded-lg ${
            isExpired ? 'bg-red-50 border border-red-200' : 
            isExpiringSoon ? 'bg-yellow-50 border border-yellow-200' : 
            'bg-green-50 border border-green-200'
          }`}>
            <div className="flex items-center gap-2">
              <Calendar className={`w-4 h-4 ${
                isExpired ? 'text-red-600' : 
                isExpiringSoon ? 'text-yellow-600' : 
                'text-green-600'
              }`} />
              <div>
                <p className={`text-xs font-medium ${
                  isExpired ? 'text-red-700' : 
                  isExpiringSoon ? 'text-yellow-700' : 
                  'text-green-700'
                }`}>
                  {isExpired ? 'EXPIRED' : isExpiringSoon ? 'EXPIRES SOON' : 'VALID UNTIL'}
                </p>
                <p className={`text-sm ${
                  isExpired ? 'text-red-600' : 
                  isExpiringSoon ? 'text-yellow-600' : 
                  'text-green-600'
                }`}>
                  {new Date(expirationDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Document Links */}
        {documents.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
              Supporting Documents
            </p>
            <div className="space-y-1">
              {documents.map((doc, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="h-auto p-2 justify-start text-left hover:bg-blue-50"
                  onClick={() => window.open(doc.url, '_blank', 'noopener,noreferrer')}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Download className="w-3 h-3 text-blue-600 flex-shrink-0" />
                    <span className="text-xs text-blue-600 truncate flex-1">
                      {doc.title}
                    </span>
                    <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* No Documents Notice */}
        {documents.length === 0 && primaryNOA && (
          <div className="text-center py-2">
            <p className="text-xs text-gray-500">
              No documents available for download
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NOAStatusCard;
