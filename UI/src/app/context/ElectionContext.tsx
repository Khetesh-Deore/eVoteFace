import React, { createContext, useContext, useState, ReactNode } from 'react';
import axiosInstance from '../lib/axios';
import { toast } from 'react-toastify';

interface Election {
  _id: string;
  title: string;
  description: string;
  contractAddress: string;
  phase: 'registration' | 'voting' | 'completed';
  startTime: string;
  endTime: string;
  [key: string]: any;
}

interface ElectionContextType {
  elections: Election[];
  selectedElection: Election | null;
  loading: boolean;
  error: string | null;
  fetchPublicElections: () => Promise<void>;
  fetchVoterElections: () => Promise<void>;
  fetchElectionById: (id: string) => Promise<Election>;
  fetchElectionResults: (id: string) => Promise<any>;
  getVoterStatus: (id: string) => Promise<any>;
  setSelectedElection: (election: Election | null) => void;
}

const ElectionContext = createContext<ElectionContextType | undefined>(undefined);

export const ElectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPublicElections = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/elections');
      setElections(response.data);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch elections';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchVoterElections = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/voters/elections');
      setElections(response.data);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch voter elections';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchElectionById = async (id: string): Promise<Election> => {
    try {
      const response = await axiosInstance.get(`/elections/${id}`);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch election details';
      toast.error(message);
      throw err;
    }
  };

  const fetchElectionResults = async (id: string) => {
    try {
      const response = await axiosInstance.get(`/elections/${id}/votes/results`);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch results';
      toast.error(message);
      throw err;
    }
  };

  const getVoterStatus = async (id: string) => {
    try {
      const response = await axiosInstance.get(`/elections/${id}/voters/status`);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch voter status';
      toast.error(message);
      throw err;
    }
  };

  return (
    <ElectionContext.Provider
      value={{
        elections,
        selectedElection,
        loading,
        error,
        fetchPublicElections,
        fetchVoterElections,
        fetchElectionById,
        fetchElectionResults,
        getVoterStatus,
        setSelectedElection,
      }}
    >
      {children}
    </ElectionContext.Provider>
  );
};

export const useElection = () => {
  const context = useContext(ElectionContext);
  if (!context) {
    throw new Error('useElection must be used within ElectionProvider');
  }
  return context;
};
