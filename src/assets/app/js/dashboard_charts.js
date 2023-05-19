var randomScalingFactor = function() {
  return Math.round(Math.random() * 100);
};

var positive_config = {
  type: 'doughnut',
  data: {
    datasets: [{
      data: [
        randomScalingFactor(),
        randomScalingFactor(),
      ],
      backgroundColor: [
        '#e2e2e2',
        '#1a6bd8',
      ],
      label: 'Dataset 1'
    }],
    labels: [
      'Open',
      'Closed',
    ]
  },
  options: {
    responsive: true,
    legend: {
      position: 'top',
    },
    title: {
      display: false,
      text: 'Chart.js Doughnut Chart'
    },
    animation: {
      animateScale: true,
      animateRotate: true
    }

  }
};

var near_miss_config = {
  type: 'doughnut',
  data: {
    datasets: [{
      data: [
        randomScalingFactor(),
        randomScalingFactor(),
      ],
      backgroundColor: [
        '#e2e2e2',
        '#540ca0',
      ],
      label: 'Dataset 1'
    }],
    labels: [
      'Open',
      'Closed',
    ]
  },
  options: {
    responsive: true,
    legend: {
      position: 'top',
    },
    title: {
      display: false,
      text: 'Chart.js Doughnut Chart'
    },
    animation: {
      animateScale: true,
      animateRotate: true
    }

  }
};


var accident_config = {
  type: 'doughnut',
  data: {
    datasets: [{
      data: [
        randomScalingFactor(),
        randomScalingFactor(),
      ],
      backgroundColor: [
        '#e2e2e2',
        '#07600a',
      ],
      label: 'Dataset 1'
    }],
    labels: [
      'Open',
      'Closed',
    ]
  },
  options: {
    responsive: true,
    legend: {
      position: 'top',
    },
    title: {
      display: false,
      text: 'Chart.js Doughnut Chart'
    },
    animation: {
      animateScale: true,
      animateRotate: true
    }

  }
};

// var ctx = document.getElementById("positive_observations_chart").getContext('2d');
window.onload = function () {
  var positive_ctx = document.getElementById("positive_observations_chart").getContext("2d");
  var positive_chart = new Chart(positive_ctx, positive_config);

  var near_miss_ctx = document.getElementById("near_miss_chart").getContext("2d");
  var near_miss_chart = new Chart(near_miss_ctx, near_miss_config);

  // var accident_ctx = document.getElementById("accident_chart").getContext("2d");
  // var chart = new Chart(accident_ctx, accident_config);
};
