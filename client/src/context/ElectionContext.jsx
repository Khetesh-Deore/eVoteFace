import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../utils/api";

const ElectionContext = createContext(null);

export const ElectionProvider = ({ children }) => {
  const [candidates, setCandidates] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [phase, setPhase]           = useState(null);
  const [winner, setWinner]         = useState(null);
  const [loading, setLoading]       = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get("/votes/results");
      setCandidates(res.data.candidates || []);
      setTotalVotes(res.data.totalVotes || 0);
      setPhase(res.data.phase || null);
      setWinner(res.data.winner || null);
    } catch {
      // silent fail — results page handles its own error state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ElectionContext.Provider value={{ candidates, totalVotes, phase, winner, loading, refresh }}>
      {children}
    </ElectionContext.Provider>
  );
};

export const useElection = () => {
  const ctx = useContext(ElectionContext);
  if (!ctx) throw new Error("useElection must be used inside ElectionProvider");
  return ctx;
};
