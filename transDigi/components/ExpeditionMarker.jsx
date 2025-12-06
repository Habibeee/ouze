import React from 'react';

const ExpeditionMarker = ({ expedition }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'en_retard': return 'en_retard';
      case 'en_cours': return 'en_cours';
      case 'livré': return 'livré';
      default: return '';
    }
  };

  return (
    <div className={`expedition-marker ${getStatusColor(expedition.statut)}`}>
      {expedition.reference.substring(expedition.reference.length - 3)}
    </div>
  );
};

export default ExpeditionMarker;
