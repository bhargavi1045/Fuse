let counter = 0;

function nextSequenceNumber() {
  counter += 1;
  return counter;
}

function resetSequenceNumber() {
  counter = 0;
}

export { nextSequenceNumber, resetSequenceNumber };
