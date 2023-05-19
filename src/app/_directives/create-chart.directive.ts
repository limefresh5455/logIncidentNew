import {Directive, ElementRef, Input, OnInit} from '@angular/core';
import {Chart} from 'chart.js';
import {ActivatedRoute, Router} from '@angular/router';

@Directive({
  selector: '[appCreateChart]'
})
export class CreateChartDirective implements OnInit {

  @Input() incidentType: any;
  @Input() currentUser: any;

  constructor(private elementRef: ElementRef,private router: Router,) {
    // this.createChart(this.incidentType, 0);
  }

  ngOnInit() {
    this.createChart(this.incidentType, 0);
  }

  createChart(type: any, closed_count: number) {
    // const htmlRef = this.elementRef.nativeElement.querySelector(`#${element_id}`);
    const htmlRef = this.elementRef.nativeElement;

    const labels = [];
    const counts = [];
    const colors = [];

    const colorsCodes = [type.color, '#e2e2e2'];

    for (const i of Object.keys(type.countByStatus)) {
      colorsCodes.push('#' + Math.random().toString(16).substr(-6));
    }

    let index = 0;
    for (const status of Object.keys(type.countByStatus)) {
     // labels.push(status);
       labels.push(status + ":"+ type.countByStatus[status]);
     //labels.push(type.countByStatus[status]);
     
      counts.push(type.countByStatus[status]);
      // colors.push(colorsCodes[index]);

      if (status === 'Open') {
        colors.push(type.color);
      } else {
        colors.push(colorsCodes[1]);
      }

      // if (index === 0) {
      //   colors.push(type.color);
      // } else {
      //   colors.push(colorsCodes[0]);
      // }

      index += 1;
    }
    const config = {
      type: 'doughnut',
      data: {
        datasets: [{
          data: counts,
          backgroundColor: colors,
          label: 'Dataset 1'
        }],
        labels: labels
      },
      options: {
        responsive: true,
         hover: {
         onHover: function(e) {
             e.target.style.cursor = 'pointer';
              }
            },
        onClick: (event,item) => {
          if(item[0] !== undefined){
            let countType= labels[item[0]._index];
            let param = type.name
            if(this.currentUser.admin === true){
              this.router.navigateByUrl('/company-view?type='+param+'&countType='+countType);
            } else{
              this.router.navigateByUrl('/my-view?type='+param);
            }
          }
        },
        legend: {
          position: 'left',
        },
        title: {
          display: false,
          text: 'Chart.js Doughnut Chart'
        },
        animation: {
          animateScale: true,
          animateRotate: true
        },
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data) {
              var dataset = data.datasets[tooltipItem.datasetIndex];
              var total = dataset.data.reduce(function(previousValue, currentValue, currentIndex, array) {
                return previousValue + currentValue;
              });
              var currentValue = dataset.data[tooltipItem.index];
              var percentage = Math.floor(((currentValue/total) * 100)+0.5);         
              return percentage + "%";
            }
          }
        }
      }
    };

    const chart = new Chart(htmlRef, config);
  }

}
