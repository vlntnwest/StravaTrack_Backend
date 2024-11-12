module.exports.mpsToMinpKm = (speeds) => {
  return speeds.map((speed) => {
    if (speed <= 0) {
      return 0;
    }
    const minutesPerKm = 1000 / (speed * 60);

    return parseFloat(minutesPerKm.toFixed(2));
  });
};
