
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

  const pc = useRef<RTCPeerConnection>(new RTCPeerConnection(servers));

  useEffect(() => {
    const setupCall = async () => {
      // 1. Setup Local Stream
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      stream.getTracks().forEach((track) => {
        pc.current.addTrack(track, stream);
      });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      // 2. Setup Remote Stream handling
      const remote = new MediaStream();
      setRemoteStream(remote);
      pc.current.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remote.addTrack(track);
        });
      };
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remote;

      // 3. Signaling
      const callDoc = doc(db, 'calls', callId);
      const offerCandidates = collection(callDoc, 'offerCandidates');
      const answerCandidates = collection(callDoc, 'answerCandidates');

      // Handle ICE candidates
      pc.current.onicecandidate = (event) => {
        if (event.candidate) {
          const targetCollection = isCaller ? offerCandidates : answerCandidates;
          addDoc(targetCollection, event.candidate.toJSON());
        }
      };

      if (isCaller) {
        // Create Offer
        const offerDescription = await pc.current.createOffer();
        await pc.current.setLocalDescription(offerDescription);

        const offer = {
          sdp: offerDescription.sdp,
          type: offerDescription.type,
        };

        await setDoc(callDoc, { offer, status: 'calling' }, { merge: true });

        // Listen for Answer
        onSnapshot(callDoc, (snapshot) => {
          const data = snapshot.data();
          if (!pc.current.currentRemoteDescription && data?.answer) {
            const answerDescription = new RTCSessionDescription(data.answer);
            pc.current.setRemoteDescription(answerDescription);
            setConnectionStatus('متصل');
          }
        });
      } else {
        // Callee Logic: Wait for Local Description set first? No, we wait for Offer.

        // We need to continuously listen to the doc in case offer comes in late (or already there)
        const unsubscribe = onSnapshot(callDoc, async (snapshot) => {
          const data = snapshot.data();
          if (!pc.current.currentRemoteDescription && data?.offer) {
            await pc.current.setRemoteDescription(new RTCSessionDescription(data.offer));

            const answerDescription = await pc.current.createAnswer();
            await pc.current.setLocalDescription(answerDescription);

            const answer = {
              type: answerDescription.type,
              sdp: answerDescription.sdp,
            };

            await updateDoc(callDoc, { answer, status: 'connected' });
            setConnectionStatus('متصل');
          }
        });
      }

      // Listen for Remote ICE Candidates
      const targetCandidateCollection = isCaller ? answerCandidates : offerCandidates;
      onSnapshot(targetCandidateCollection, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            pc.current.addIceCandidate(candidate);
          }
        });
      });
    };

    setupCall();

    return () => {
      // Cleanup
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      pc.current.close();
    }
  }, []); // Run once on mount

  const handleHangup = async () => {
    // Stop tracks
    localStream?.getTracks().forEach(track => track.stop());
    // Close PC
    pc.current.close();
    // Update doc
    try {
      await updateDoc(doc(db, 'calls', callId), { status: 'ended' });
    } catch (e) {
      console.error(e);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center">
      <div className="relative w-full h-full md:w-[90%] md:h-[90vh] md:max-w-4xl bg-slate-900 md:rounded-3xl overflow-hidden shadow-2xl border-slate-700">

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
            className="w-full h-full object-cover scale-x-[-1]"
          />
        </div>

        {/* Controls */}
        <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center gap-4 md:gap-6 z-30">
          <button className="p-3 md:p-4 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors">
            {/* Mute toggle icon placeholder */}
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" strokeWidth="2" /></svg>
          </button>

          <button
            onClick={handleHangup}
            className="p-4 md:p-5 bg-red-600 hover:bg-red-500 rounded-full text-white transition-all transform hover:scale-110 shadow-lg shadow-red-900/50"
          >
            <svg className="w-7 h-7 md:w-8 md:h-8 rotate-[135deg]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
          </button>

          <button className="p-3 md:p-4 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors">
            {/* Camera toggle icon placeholder */}
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeWidth="2" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
