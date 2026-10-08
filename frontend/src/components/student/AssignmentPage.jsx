import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Upload, FileText, Download, Play, 
  CheckCircle2, Clock, AlertCircle, File, Eye, Award, MessageSquare, BookOpen, Layers, Check, Plus
} from 'lucide-react';
import { getSubmissions, getCreatedAssignments, createSubmission } from '../../api/assignmentApi';
import { useAuth } from '../../context/AuthContext';
import UniversalFileViewerModal from '../common/UniversalFileViewerModal';

export default function AssignmentPage({ setActiveScreen }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' | 'extra'
  const [submissions, setSubmissions] = useState([]);
  const [createdAssignments, setCreatedAssignments] = useState([]);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('All');
  const [viewerFile, setViewerFile] = useState(null);
  
  // Submission Form State for new upload
  const [submittingAsgId, setSubmittingAsgId] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [answerNotes, setAnswerNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const studentIdentifier = user?.email || user?.id || '';
  const studentName = user?.name || '';
  const studentBatch = user?.batch || (user?.courseBatches?.[0]?.batch) || '';

  useEffect(() => {
    loadData();
  }, [studentIdentifier, studentName]);

  const loadData = async () => {
    try {
      const subsRes = await getSubmissions();
      const allSubs = subsRes.data || [];
      const studentSubs = allSubs.filter(s => 
        s.studentEmail?.toLowerCase() === studentIdentifier.toLowerCase() ||
        s.studentName?.toLowerCase() === studentName.toLowerCase()
      );
      setSubmissions(studentSubs);

      const asgRes = await getCreatedAssignments();
      const allAsgs = asgRes.data || [];
      
      // Filter Extra Assignments targeted to this student
      const targetedAsgs = allAsgs.filter(asg => {
        if (asg.targetType === 'course') return true;
        if (asg.targetType === 'batch' && (asg.batch === studentBatch || asg.targetBatch === studentBatch || asg.targetName === studentBatch)) return true;
        if (asg.targetType === 'student') {
          if (asg.targetStudentEmail && asg.targetStudentEmail.toLowerCase() === studentIdentifier.toLowerCase()) return true;
          if (Array.isArray(asg.targetStudentEmails) && asg.targetStudentEmails.some(e => e.toLowerCase() === studentIdentifier.toLowerCase())) return true;
          if (Array.isArray(asg.targetStudentNames) && asg.targetStudentNames.some(n => n.toLowerCase() === studentName.toLowerCase())) return true;
        }
        return false;
      });

      setCreatedAssignments(targetedAsgs.length > 0 ? targetedAsgs : allAsgs);
    } catch (err) {
      console.error('Error loading student assignments:', err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    const objectUrl = URL.createObjectURL(file);

    setUploadFile({
      name: file.name,
      fileUrl: objectUrl,
      type: ext,
      size: sizeMb
    });
  };

  const handleSubmitExtraAssignment = async (e, asg) => {
    e.preventDefault();
    if (!uploadFile && !answerNotes.trim()) return;

    try {
      await createSubmission({
        mode: 'Online',
        courseTitle: asg.course || 'English Communication',
        batchName: studentBatch,
        studentName: studentName,
        studentEmail: studentIdentifier,
        assignmentTitle: asg.title,
        sourceType: 'extra',
        sourceId: asg.id,
        attachment: uploadFile || null,
        answerText: answerNotes.trim() || 'Submitted response.',
        assignedTrainer: asg.createdBy || asg.assignedTrainer || 'Course Trainer'
      });

      setSuccessMsg(`Extra Assignment "${asg.title}" submitted successfully! Trainer will evaluate your work.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setUploadFile(null);
      setAnswerNotes('');
      setSubmittingAsgId(null);
      await loadData();
    } catch (err) {
      console.error('Submission failed:', err);
    }
  };

  // Extract unique course titles
  const courseTitles = Array.from(new Set([
    ...submissions.map(s => s.courseTitle).filter(Boolean),
    ...createdAssignments.map(a => a.course).filter(Boolean),
    'Grammar + Phonics + Spoken English',
    'Self-Paced Recorded Phonics Course'
  ]));

  const groupedSubmissions = {};
  courseTitles.forEach(c => {
    groupedSubmissions[c] = submissions.filter(s => s.courseTitle === c);
  });

  const filteredCourses = selectedCourseFilter === 'All' 
    ? courseTitles 
    : courseTitles.filter(c => c === selectedCourseFilter);

  const filteredExtraAssignments = createdAssignments.filter(a => 
    selectedCourseFilter === 'All' || a.course === selectedCourseFilter
  );

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <button 
            onClick={() => setActiveScreen('student-dash')}
            className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Course Assignments</h1>
          <p className="text-xs text-slate-500 font-medium">View submitted work, submit extra assignments, and check Trainer's evaluation responses.</p>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-500">Course:</span>
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
          >
            <option value="All">All Courses</option>
            {courseTitles.map((cTitle, idx) => (
              <option key={idx} value={cTitle}>{cTitle}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Tabs (Requirement 20: [ Assignments ] vs [ Extra Assignments ]) */}
      <div className="flex border-b border-slate-200 gap-6 text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-3 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'assignments'
              ? 'border-blue-600 text-blue-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Course Submissions & Evaluated Work ({submissions.length})
        </button>

        <button
          onClick={() => setActiveTab('extra')}
          className={`pb-3 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'extra'
              ? 'border-purple-600 text-purple-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Extra Assignments ({filteredExtraAssignments.length})
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-600 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-md">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TAB 1: NORMAL COURSE ASSIGNMENTS & SUBMISSIONS */}
      {activeTab === 'assignments' && (
        <div className="space-y-8">
          {filteredCourses.map((cTitle) => {
            const courseSubs = groupedSubmissions[cTitle] || [];
            return (
              <div key={cTitle} className="space-y-4">
                
                {/* Course Header Banner */}
                <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-900">{cTitle}</h2>
                      <p className="text-[11px] text-slate-500 font-semibold">{courseSubs.length} Assignment Submissions</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-extrabold uppercase px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                    Course Section
                  </span>
                </div>

                {/* Assignment Cards Grid */}
                {courseSubs.length === 0 ? (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-2">
                    <p className="text-xs font-bold text-slate-400">No submissions recorded for this course yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {courseSubs.map((sub) => {
                      const isCorrected = sub.status === 'Corrected' || sub.status === 'Reviewed';
                      const modeVal = sub.mode || 'Online';

                      return (
                        <div key={sub.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 space-y-5 flex flex-col justify-between">
                          
                          {/* Assignment Card Header */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase ${
                                modeVal === 'Online' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                modeVal === 'Recorded' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {modeVal} MODE
                              </span>

                              <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase border ${
                                isCorrected
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`}>
                                {isCorrected ? '✓ Corrected & Evaluated' : '⏳ Pending Correction'}
                              </span>
                            </div>

                            <h3 className="text-base font-black text-slate-900">{sub.assignmentTitle}</h3>

                            {/* Student Submission Info */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                              <div className="flex justify-between items-center text-slate-500 font-semibold">
                                <span>Submitted On:</span>
                                <span className="font-bold text-slate-800">{sub.submittedAt}</span>
                              </div>

                              {sub.answerText && (
                                <div className="text-slate-600 font-medium italic">
                                  "{sub.answerText}"
                                </div>
                              )}

                              {sub.attachment && (
                                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                                  <div className="flex items-center space-x-2 text-slate-700 font-bold">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                    <span className="truncate max-w-[180px]">{sub.attachment.name}</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => setViewerFile(sub.attachment)}
                                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-extrabold px-3 py-1.5 rounded-lg inline-flex items-center space-x-1 cursor-pointer transition-colors"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View File</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* TRAINER'S RESPONSE SECTION */}
                          {isCorrected ? (
                            <div className="bg-emerald-50/70 border border-emerald-200 p-5 rounded-2xl space-y-3">
                              <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                                <div className="flex items-center space-x-2 text-emerald-900 font-black text-xs">
                                  <Award className="w-4 h-4 text-emerald-600" />
                                  <span>Trainer's Response & Evaluation</span>
                                </div>

                                {sub.score && (
                                  <span className="bg-emerald-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-xs">
                                    Score: {sub.score}
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
                                <div>
                                  <span className="text-slate-400">Reviewed By:</span>
                                  <div className="font-extrabold text-slate-800">{sub.correctedBy || sub.assignedTrainer || 'Course Trainer'}</div>
                                </div>
                                <div>
                                  <span className="text-slate-400">Reviewed Date:</span>
                                  <div className="font-extrabold text-slate-800">{sub.correctedAt || '23/09/2026'}</div>
                                </div>
                              </div>

                              {(sub.remarks || sub.feedback) && (
                                <div className="bg-white p-3 rounded-xl border border-emerald-200/60 text-xs text-slate-700 font-medium">
                                  <div className="font-bold text-emerald-800 text-[10px] uppercase mb-0.5">Trainer Feedback / Remarks:</div>
                                  {sub.remarks || sub.feedback}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="bg-amber-50/60 border border-amber-200/80 p-4 rounded-2xl text-xs space-y-1">
                              <div className="font-extrabold text-amber-900 flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-amber-600" /> Trainer Correction Pending
                              </div>
                              <p className="text-amber-700 font-medium text-[11px]">
                                Assigned Trainer: <span className="font-bold">{sub.assignedTrainer || 'Course Trainer'}</span>. You will receive marks & feedback once reviewed.
                              </p>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: EXTRA ASSIGNMENTS ASSIGNED BY TRAINER */}
      {activeTab === 'extra' && (
        <div className="space-y-6">
          {filteredExtraAssignments.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <BookOpen className="w-12 h-12 text-purple-300 mx-auto" />
              <h3 className="text-base font-black text-slate-800">No Extra Assignments Pending</h3>
              <p className="text-xs text-slate-500 font-medium">You currently have no extra assignments assigned for your course or batch.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredExtraAssignments.map((asg) => {
                const existingSub = submissions.find(s => s.assignmentTitle === asg.title || s.sourceId === asg.id);
                const isCorrected = existingSub && (existingSub.status === 'Corrected' || existingSub.status === 'Reviewed');
                const isSubmitted = Boolean(existingSub);

                return (
                  <div key={asg.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 space-y-5 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                          EXTRA ASSIGNMENT
                        </span>
                        <span className="text-xs font-bold text-slate-500">Due: {asg.dueDate}</span>
                      </div>

                      <h3 className="text-lg font-black text-slate-900">{asg.title}</h3>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{asg.description}</p>

                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs space-y-1">
                        <div className="flex justify-between font-bold text-slate-700">
                          <span>Course: <strong className="text-blue-900">{asg.course}</strong></span>
                          <span>Assigned By: <strong>{asg.createdBy || 'Course Trainer'}</strong></span>
                        </div>
                        {asg.attachment && (
                          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-slate-700 font-bold truncate">
                              <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                              <span className="truncate">{asg.attachment.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setViewerFile(asg.attachment)}
                              className="bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-extrabold px-3 py-1.5 rounded-lg inline-flex items-center space-x-1 cursor-pointer shrink-0"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Reference</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Submission / Evaluation Box */}
                    {isCorrected ? (
                      <div className="bg-emerald-50/70 border border-emerald-200 p-5 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                          <div className="flex items-center space-x-2 text-emerald-900 font-black text-xs">
                            <Award className="w-4 h-4 text-emerald-600" />
                            <span>Trainer's Response & Evaluation</span>
                          </div>
                          {existingSub.score && (
                            <span className="bg-emerald-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-xs">
                              Score: {existingSub.score}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
                          <div>
                            <span className="text-slate-400">Reviewed By:</span>
                            <div className="font-extrabold text-slate-800">{existingSub.correctedBy || asg.createdBy || 'Course Trainer'}</div>
                          </div>
                          <div>
                            <span className="text-slate-400">Reviewed Date:</span>
                            <div className="font-extrabold text-slate-800">{existingSub.correctedAt || 'Recent'}</div>
                          </div>
                        </div>
                        {(existingSub.remarks || existingSub.feedback) && (
                          <div className="bg-white p-3 rounded-xl border border-emerald-200/60 text-xs text-slate-700 font-medium">
                            <div className="font-bold text-emerald-800 text-[10px] uppercase mb-0.5">Trainer Feedback:</div>
                            {existingSub.remarks || existingSub.feedback}
                          </div>
                        )}
                      </div>
                    ) : isSubmitted ? (
                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs space-y-1">
                        <div className="font-extrabold text-amber-900 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-600" /> Submitted • Pending Trainer Correction
                        </div>
                        <p className="text-amber-700 font-medium text-[11px]">
                          Submitted on {existingSub.submittedAt}. Trainer will grade your extra assignment soon.
                        </p>
                      </div>
                    ) : (
                      /* Form for Uploading extra assignment submission (Requirement 20.3: broad format support) */
                      <form onSubmit={(e) => handleSubmitExtraAssignment(e, asg)} className="space-y-3 pt-2 border-t border-slate-100">
                        <label className="block text-xs font-bold text-slate-700">Submit Work (PDF, DOC, DOCX, PPT, XLS, Image, Audio, Video)</label>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.avi,.webm,.mp3,.wav,.m4a"
                          onChange={handleFileChange}
                          className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                        />
                        <textarea
                          rows={2}
                          placeholder="Optional notes or text response for trainer..."
                          value={answerNotes}
                          onChange={(e) => setAnswerNotes(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-md cursor-pointer transition-colors"
                        >
                          Submit Extra Assignment Work
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Universal File Viewer Modal */}
      <UniversalFileViewerModal
        isOpen={Boolean(viewerFile)}
        onClose={() => setViewerFile(null)}
        file={viewerFile}
      />

    </div>
  );
}
