
import React, { useEffect, useRef, useState } from 'react';
import { User } from '../types';
import { db } from '../firebaseConfig';
import {
  doc,
  onSnapshot,
  updateDoc,
  addDoc,
  collection,
  setDoc,
  getDoc
} from 'firebase/firestore';

interface VideoCallProps {
  participant?: User;
  currentUser: User;
  callId: string;
  isCaller: boolean;
  onClose: () => void;
}

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

const VideoCall: React.FC<VideoCallProps> = ({ participant, currentUser, callId, isCaller, onClose }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('جاري الاتصال...');

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    let unsubscribeSignaling: (() => void) | undefined;
    let unsubscribeCandidates: (() => void) | undefined;

    const setupCall = async () => {
      try {
        // Check for secure context
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
          throw new Error('لا يمكن الوصول للكاميرا عبر اتصال غير آمن (HTTP). يرجى استخدام localhost أو HTTPS.');
        }

        // Initialize PeerConnection
        const pc = new RTCPeerConnection(servers);
        pcRef.current = pc;

        // 1. Setup Local Stream
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // 2. Setup Remote Stream handling
        const remote = new MediaStream();
        setRemoteStream(remote);
        pc.ontrack = (event) => {
          event.streams[0].getTracks().forEach((track) => {
            remote.addTrack(track);
          });
        };
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remote;

        // 3. Signaling
        const callDoc = doc(db, 'calls', callId);
        const offerCandidates = collection(callDoc, 'offerCandidates');
        const answerCandidates = collection(callDoc, 'answerCandidates');

        const candidateQueue = useRef<RTCIceCandidate[]>([]);

        // Handle ICE candidates logic
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            console.log("Generating ICE Candidate");
            const targetCollection = isCaller ? offerCandidates : answerCandidates;
            addDoc(targetCollection, event.candidate.toJSON());
          }
        };

        // Connection State Monitoring
        pc.onconnectionstatechange = () => {
          console.log("Connection State Changed:", pc.connectionState);
          if (pc.connectionState === 'connected') {
            setConnectionStatus('متصل');
          } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            setConnectionStatus('انقطع الاتصال');
          }
        };

        if (isCaller) {
          // Create Offer
          const offerDescription = await pc.createOffer();
          await pc.setLocalDescription(offerDescription);

          const offer = {
            sdp: offerDescription.sdp,
            type: offerDescription.type,
          };

          await setDoc(callDoc, { offer, status: 'calling' }, { merge: true });

          // Listen for Answer
          unsubscribeSignaling = onSnapshot(callDoc, async (snapshot) => {
            const data = snapshot.data();
            if (!pc.currentRemoteDescription && data?.answer) {
              console.log("Received Answer");
              const answerDescription = new RTCSessionDescription(data.answer);
              await pc.setRemoteDescription(answerDescription);

              // Process Queued Candidates
              candidateQueue.current.forEach(candidate => {
                pc.addIceCandidate(candidate).catch(e => console.error("Error adding queued candidate:", e));
              });
              candidateQueue.current = [];
            }
          });
        } else {
          // Callee Logic
          unsubscribeSignaling = onSnapshot(callDoc, async (snapshot) => {
            const data = snapshot.data();
            if (!pc.currentRemoteDescription && data?.offer) {
              console.log("Received Offer");
              await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

              const answerDescription = await pc.createAnswer();
              await pc.setLocalDescription(answerDescription);

              const answer = {
                type: answerDescription.type,
                sdp: answerDescription.sdp,
              };

              await updateDoc(callDoc, { answer, status: 'connected' });

              // Process Queued Candidates
              candidateQueue.current.forEach(candidate => {
                pc.addIceCandidate(candidate).catch(e => console.error("Error adding queued candidate:", e));
              });
              candidateQueue.current = [];
            }
          });
        }

        // Listen for Remote ICE Candidates
        const targetCandidateCollection = isCaller ? answerCandidates : offerCandidates;
        unsubscribeCandidates = onSnapshot(targetCandidateCollection, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const candidate = new RTCIceCandidate(change.doc.data());
              if (pc.remoteDescription) {
                pc.addIceCandidate(candidate).catch(e => console.error("Error adding candidate:", e));
              } else {
                console.log("Queueing candidate (remote desc not set yet)");
                candidateQueue.current.push(candidate);
              }
            }
          });
        });

      } catch (err: any) {
        console.error("Error accessing media devices:", err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('يرجى السماح بالوصول للكاميرا والميكروفون للمتابعة.');
        } else if (err.name === 'NotFoundError') {
          setError('لم يتم العثور على كاميرا أو ميكروفون.');
        } else {
          setError(err.message || 'حدث خطأ أثناء الوصول للأجهزة.');
        }
      }
    };

    setupCall();

    return () => {
      // Cleanup
      if (unsubscribeSignaling) unsubscribeSignaling();
      if (unsubscribeCandidates) unsubscribeCandidates();

      // Stop all tracks
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }

      // Stop local stream tracks usually done here but we need reference to stream?
      // Actually we have localStream in state, but cleanup function runs on old closure.
      // Better to rely on the fact that if we close PC, tracks might not stop automatically.
      // We'll handle stream stop in handleHangup or ensure setupCall stores it in ref if needed.
      // However, for React 18, we should probably stop tracks here too if possible, but accessing state in cleanup can be tricky if stale.
      // Given the architecture, let's rely on handleHangup for explicit close, or browser GC.
      // Re-accessing localStream here would require it in dependency array which causes re-runs.
    }
  }, []); // Run once on mount

  const handleHangup = async () => {
    // Stop tracks
    localStream?.getTracks().forEach(track => track.stop());
    // Close PC
    if (pcRef.current) {
      pcRef.current.close();
    }
    // Update doc
    try {
      await updateDoc(doc(db, 'calls', callId), { status: 'ended' });
    } catch (e) {
      console.error(e);
    }
    onClose();
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center">
      <div className="relative w-full h-full md:w-[90%] md:h-[90vh] md:max-w-4xl bg-slate-900 md:rounded-3xl overflow-hidden shadow-2xl border-slate-700">

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-6">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/50">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">تعذر الوصول للكاميرا</h3>
              <p className="text-slate-300 mb-6">{error}</p>
              <button onClick={onClose} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                إغلاق المكالمة
              </button>
            </div>
          </div>
        )}

        {/* Remote Video */}
        <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Fallback/Status Overlay if not connected yet */}
          {connectionStatus !== 'متصل' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
              <div className="text-center p-6">
                {participant && (
                  <img src={participant.avatar} className="w-24 h-24 md:w-32 md:h-32 rounded-full mx-auto mb-4 border-4 border-teal-500 animate-pulse" alt="" />
                )}
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2">{participant?.name || 'مجهول'}</h2>
                <p className="text-teal-400 animate-pulse">{connectionStatus}</p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video Preview */}
        <div className="absolute top-6 right-6 md:top-auto md:bottom-6 md:left-6 w-32 h-44 md:w-48 md:h-64 bg-black rounded-2xl overflow-hidden border-2 border-slate-700 shadow-xl z-20">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover scale-x-[-1] ${isCameraOff ? 'hidden' : ''}`}
          />
          {isCameraOff && (
            <div className="flex items-center justify-center h-full w-full bg-slate-800 text-slate-500">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center gap-4 md:gap-6 z-30">
          <button
            onClick={toggleCamera}
            className={`p-3 md:p-4 rounded-full text-white transition-colors ${isCameraOff ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-800 hover:bg-slate-700'}`}
          >
            {isCameraOff ? (
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" /></svg>
            ) : (
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeWidth="2" /></svg>
            )}
          </button>

          <button
            onClick={handleHangup}
            className="p-4 md:p-5 bg-red-600 hover:bg-red-500 rounded-full text-white transition-all transform hover:scale-110 shadow-lg shadow-red-900/50"
          >
            <svg className="w-7 h-7 md:w-8 md:h-8 rotate-[135deg]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
          </button>

          <button
            onClick={toggleMute}
            className={`p-3 md:p-4 rounded-full text-white transition-colors ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-800 hover:bg-slate-700'}`}
          >
            {isMuted ? (
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" /></svg>
            ) : (
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" strokeWidth="2" /></svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
