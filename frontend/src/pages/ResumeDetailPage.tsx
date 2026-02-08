import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Resume, ResumeStatus, WorkflowLog, ActionType, Source } from '../types';
import ResumeStatusBadge from '../components/ResumeStatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeft, Download, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { showToast } from '../lib/toast';

const ResumeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resume, setResume] = useState<Resume | null>(null);
  const [logs, setLogs] = useState<WorkflowLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchResumeDetails = async () => {
      setIsLoading(true);
      try {
        // Mock data
        // const resumeRes = await api.get(`/resumes/${id}`);
        // const logsRes = await api.get(`/resumes/${id}/logs`);
        
        // Mocking
        setTimeout(() => {
          setResume({
            id: id || '1',
            candidateName: 'John Doe',
            email: 'john@example.com',
            phone: '1234567890',
            source: Source.A,
            status: ResumeStatus.POOL_HR,
            resumeUrl: '/path/to/resume.pdf',
            uploaderId: '1',
            uploaderName: 'HR Manager',
            school: '清华大学',
            skills: ['React', 'TypeScript', 'Node.js', 'Tailwind'],
            isOverdue: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          
          setLogs([
            {
              id: '1',
              resumeId: id || '1',
              operatorId: '1',
              operatorName: 'HR Manager',
              action: ActionType.UPLOAD,
              newStatus: ResumeStatus.POOL_HR,
              timestamp: new Date().toISOString(),
              comment: 'Initial upload'
            }
          ]);
          setIsLoading(false);
        }, 500);
      } catch (error) {
        showToast.error('加载简历详情失败');
        setIsLoading(false);
      }
    };

    fetchResumeDetails();
  }, [id]);

  const handleStatusChange = async (newStatus: ResumeStatus) => {
    // Implement status change logic
    showToast.info(`状态变更为 ${newStatus}`);
    // await api.put(`/resumes/${id}/status`, { status: newStatus, comment });
    // Refresh data...
  };

  // Expose for future use
  void handleStatusChange;

  if (isLoading) return <LoadingSpinner />;
  if (!resume) return <div>Resume not found</div>;

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{resume.candidateName}</h1>
                <div className="mt-2 flex items-center space-x-4 text-sm text-slate-500">
                  <span>{resume.email}</span>
                  <span>•</span>
                  <span>{resume.phone}</span>
                </div>
              </div>
              <ResumeStatusBadge status={resume.status} />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-slate-500">毕业院校</h3>
                <p className="mt-1 text-slate-900">{resume.school || '未填写'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-500">来源</h3>
                <p className="mt-1 text-slate-900">{resume.source}</p>
              </div>
              {resume.skills && resume.skills.length > 0 && (
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-slate-500">技能</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {resume.skills.map(skill => (
                      <span key={skill} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-slate-900">Resume File</h3>
                <button className="flex items-center text-blue-600 hover:text-blue-800">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </button>
              </div>
              <div className="mt-4 bg-slate-50 h-96 rounded border border-slate-200 flex items-center justify-center text-slate-400">
                PDF Preview Placeholder
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Actions & History */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Actions</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Comment</label>
                <textarea 
                  className="input-field h-24 resize-none"
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-primary w-full text-sm">Pass Screening</button>
                <button className="btn-secondary w-full text-sm text-red-600 hover:bg-red-50 border-red-200">Reject</button>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-lg font-medium text-slate-900 mb-4">History</h3>
            <div className="flow-root">
              <ul className="-mb-8">
                {logs.map((log, logIdx) => (
                  <li key={log.id}>
                    <div className="relative pb-8">
                      {logIdx !== logs.length - 1 ? (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center ring-8 ring-white">
                            <UserIcon className="h-4 w-4 text-slate-500" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-slate-500">
                              <span className="font-medium text-slate-900">{log.operatorName}</span> {log.action.toLowerCase().replace('_', ' ')}
                            </p>
                            {log.comment && (
                              <p className="mt-1 text-sm text-slate-600 bg-slate-50 p-2 rounded">
                                "{log.comment}"
                              </p>
                            )}
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-slate-500">
                            <time dateTime={log.timestamp}>{format(new Date(log.timestamp), 'MMM d')}</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeDetailPage;
