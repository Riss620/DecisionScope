import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SimulationContext = createContext();

export function useSimulation() {
  return useContext(SimulationContext);
}

export function SimulationProvider({ children }) {
  const [simulations, setSimulations] = useState({});
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket connection globally, respecting production domains
    const backendUrl = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '/');
    const newSocket = io(backendUrl);
    setSocket(newSocket);

    // Dynamic listener for any simulation events
    newSocket.onAny((eventName, data) => {
      if (eventName.startsWith('simulation:')) {
        const parts = eventName.split(':');
        if (parts.length >= 3) {
          const id = parts[1];
          const type = parts[2]; // progress, complete, error

          setSimulations(prev => {
            const currentSim = prev[id] || {
              status: 'idle',
              progressLog: [],
              impactData: [],
              finalRecommendation: '',
              finalConfidence: null,
              errorMessage: '',
              policyContext: '',
              proposedAction: '',
              isDemoMode: false
            };

            const updatedSim = { ...currentSim };

            if (type === 'progress') {
              updatedSim.progressLog = [...updatedSim.progressLog, data];
              
              if (data.node === 'simulationNode' && data.state.stakeholderImpacts) {
                const impacts = data.state.stakeholderImpacts;
                updatedSim.impactData = Object.keys(impacts).map(key => ({
                  name: key,
                  impact: Number(impacts[key]) || 0
                }));
              }
              
              if (data.node === 'judgeNode' && data.state.finalRecommendation) {
                updatedSim.finalRecommendation = data.state.finalRecommendation;
                updatedSim.finalConfidence = data.state.finalConfidence;
              }
              
              if (data.state.error) {
                updatedSim.status = 'error';
                updatedSim.errorMessage = data.state.error;
              }
            } else if (type === 'complete') {
              updatedSim.status = 'completed';
            } else if (type === 'error') {
              updatedSim.status = 'error';
              if (data && data.error && data.error.message) {
                updatedSim.errorMessage = data.error.message;
              } else if (data && typeof data === 'string') {
                updatedSim.errorMessage = data;
              } else if (data && data.message) {
                updatedSim.errorMessage = data.message;
              } else {
                updatedSim.errorMessage = 'An unknown error occurred during simulation.';
              }
              console.error(data);
            }

            return {
              ...prev,
              [id]: updatedSim
            };
          });
        }
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const initSimulationState = (id, initialState) => {
    setSimulations(prev => {
      if (prev[id]) return prev; // already initialized
      return {
        ...prev,
        [id]: {
          status: 'idle',
          progressLog: [],
          impactData: [],
          finalRecommendation: '',
          finalConfidence: null,
          errorMessage: '',
          policyContext: initialState?.policyContext ?? '',
          proposedAction: initialState?.proposedAction ?? '',
          isDemoMode: initialState?.isDemoMode ?? false
        }
      };
    });
  };

  const updateSimulationState = (id, updates) => {
    setSimulations(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        ...updates
      }
    }));
  };

  const resetSimulation = (id) => {
    setSimulations(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        status: 'running',
        progressLog: [],
        impactData: [],
        finalRecommendation: '',
        finalConfidence: null,
        errorMessage: ''
      }
    }));
  };

  return (
    <SimulationContext.Provider value={{
      simulations,
      socket,
      initSimulationState,
      updateSimulationState,
      resetSimulation
    }}>
      {children}
    </SimulationContext.Provider>
  );
}
