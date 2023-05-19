import { Component, ElementRef, OnInit, ViewChild,AfterViewInit  } from '@angular/core';
import { Chart } from 'chart.js';
import { SifService } from '../_services/sif.service';
import { CustomerService } from '../_services/customer.service';
import { IncidentsService, } from './../_services/incidents.service';
import * as moment from 'moment';
import { NgxDrpOptions, PresetItem, Range } from 'ngx-mat-daterange-picker';
declare var $: any;
@Component({
  selector: 'app-sif',
  templateUrl: './sif.component.html',
  styleUrls: ['./sif.component.css']
})
export class Sif implements OnInit{
  companyColor = null;
  accentColor = null;
  sifGraph: any
  incidentType: any
  cifCountBarChart;
  incidentWhyItBarChart;
  incidentWhatItBarChart;
  whyValuesData: any;
  whySubsetChart: any = [];
  whyValues: any;

  // date range
  fromDate;
  toDate;
  initUpdateRange = false; // tells if initial updateRange was already called. Initializatio of date range picker calls updateRange()
  range: any = { fromDate: '', toDate: '' };
  options: NgxDrpOptions;
  presets: Array<PresetItem> = [];

  constructor(
    private elementRef: ElementRef,
    private customerService: CustomerService,
    private SifService: SifService,
    private IncidentsService: IncidentsService,
  ) {
    const currentUser = this.customerService.getUser();
    this.companyColor = currentUser.company.primary;
    this.accentColor = currentUser.company.accent;
  }

   ngOnInit() {
    const startDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const startDate1 = moment(startDate).format('YYYY-MM-DD');
    const endDate = new Date();
    const endDate1 = moment(endDate).format('YYYY-MM-DD');
    this.getSIFgraphReport(startDate1, endDate1,false)
    this.customDateRange();
  }


  twoWords(data){
    var result = [];
    for (var i = 0; i < data.length; i++) {
      var wordArr = data[i].split(" ");
      var wordShort = wordArr.splice(0, 2).join(" ")
      result.push(wordShort);
    }
    return result;
  }

  getSIFgraphReport(start,end,check) {
    // For get Incident Type data
    this.whySubsetChart = []
    if (this.incidentWhyItBarChart) {
      // this.incidentWhyItBarChart.update();
      this.incidentWhyItBarChart.destroy();
    }
    // if(this.incidentWhyItBarChart){
    //   this.incidentWhyItBarChart.update();
    // }

    
    this.IncidentsService.getIncidentTypes().subscribe(r => {
      if (r.data) {
        for (var i = 0; i < r.data.length; i++) {
          if (r.data[i].name == "Hazard / Near Miss") {
            this.incidentType = r.data[i].id
            this.SifService.getSIFGraph(this.incidentType, start, end).subscribe(r => {
              const keys = Object.keys(r.data.what)
              const values = Object.values(r.data.what)
              this.whyValues = Object.values(r.data.why)
              this.whyValuesData = Object.keys(r.data.why)
              const bg_color = ['#72C02C', '#3498DB', '#717984', '#F1C40F'];
              let index = 0;
              for (const option of keys) {
                bg_color.push(this.getRandomColor());
                index++;
              }

              const whatdatasets = [];
              for (var j = 0; j < keys.length; j++){
                whatdatasets.push({
                  label: keys[j],
                  data: [values[j]],
                  backgroundColor: bg_color[j]
                })
              }
              console.log(whatdatasets)
              
              const whatBarGraph = {
                 'labels': ['SIF Category'],
                'datasets': whatdatasets
              };
              console.log(whatBarGraph)

              // let whySubsetChart = [];
              for (var i = 0; i < this.whyValuesData.length; i++){
                this.whySubsetChart.push({
                  'labels':this.twoWords(Object.keys(this.whyValues[i])),
                  'datasets': [{
                        label:this.whyValuesData[i],
                      'data':  Object.values(this.whyValues[i]),
                      'fill': false,
                      'backgroundColor': bg_color
                  }]
                });
              }
              setTimeout(() => {
                this.createIncidentSIFWhyWorkingBarChart(this.whySubsetChart,check);
              }, 2000);
              this.createIncidentSIFWhatBarChart(whatBarGraph,check);
            })
          }
        }
      }
    })
  }

  //SIF bar chart for what
  createIncidentSIFWhatBarChart(sifGraph,check) {
    const htmlRef = this.elementRef.nativeElement.querySelector(`#cifData_what_it_bar_chart`);
    const data = sifGraph
    const config = {
      type: 'bar',
      data: data,
      options: {

        responsive: true,
        tooltips: {enabled: 'label'},
        hover: {mode: 'label'},
        legend: {
          display:true,
          position: 'bottom',
          align: 'start',
          labels: {
            boxWidth: 12
          }
        },
        title: {
          display: false,
          text: 'SIF What Bar Chart'
        },
        scales: {
          yAxes: [{ ticks: { beginAtZero: true } }]
        },
      }
    };
    if (sifGraph &&  htmlRef) {
      if(check == true) {
        this.incidentWhatItBarChart.config.data = data;
        this.incidentWhatItBarChart.config.options.legend = {
          display: true,
          position: 'top',
          align: 'start',
          labels: {
            boxWidth: 12
          }
        };
        this.incidentWhatItBarChart.update();
        // this.incidentWhatItBarChart.destroy();
      } else {
        this.incidentWhatItBarChart = new Chart(htmlRef, config);
      }
        
    }
  }
 
  //SIF bar chart for what
  createIncidentSIFWhyWorkingBarChart(sifGraph,check) {
      const htmlRef =  document.querySelectorAll('.why_bar');
      for (var i = 0; i < htmlRef.length; i++) {
        const data = sifGraph[i]

        //  TEST----BKP---20230330
        
        // const config = {
        //   type: 'bar',
        //   data: data,
        //   options: {
        //     responsive: true,
        //     legend: {
        //       display: true,
        //       position: 'top',
        //     },
        //     title: {
        //       display: false,
        //       text: 'SIF What Bar Chart'
        //     },
        //     scales: {
        //       yAxes: [{
        //         ticks: {
        //           stepSize: 1,
        //           beginAtZero: true
        //         }
        //       }]
        //     },
        //   }
        // };


        const config = {
          type: 'bar',
          data: data,
          options: {
            responsive: true,
            legend: {
              display: true,
              position: 'top',
            },
            title: {
              display: false,
              text: 'SIF What Bar Chart'
            },
            scales: {
              xAxes: [{
                barThickness: 50,
                barPercentage: 0.8, 
                categoryPercentage: 0.2,
                ticks: {
                  beginAtZero: true
                }
              }],
              yAxes: [{
                ticks: {
                  stepSize: 1,
                  beginAtZero: true
                }
              }]
            },
          }
        };
        
        
        if (sifGraph &&  htmlRef[i]) {
          // if(check == true) {
          //   this.incidentWhyItBarChart.config.data = data;
          //   this.incidentWhyItBarChart.config.options.legend = {
          //     display: true,
          //     position: 'top'
          //   };
            // this.incidentWhyItBarChart.update();
          //} else {
            this.incidentWhyItBarChart = new Chart(htmlRef[i], config);
          // }
        }
        
      }
    // }, 2000)
  }

  //Color change for bar chart
  getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  //for custom bootstrap date range picker
  customDateRange() {
    var start = moment().subtract(365, 'days');
    var end = moment();

    function cb(start, end) {
      $('#sosrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
    }
    $('#sosrange').daterangepicker({
      locale: {
        format: 'DD/MM/YYYY'
      },
      startDate: start,
      endDate: end,
      maxDate: moment(),
      ranges: {
        'Today': [moment(), moment()],
        'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
        'Last 7 Days': [moment().subtract(6, 'days'), moment()],
        'Last 30 Days': [moment().subtract(29, 'days'), moment()],
        'This Month': [moment().startOf('month'), moment().endOf('month')],
        'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
      }
    }, cb);

    cb(start, end);
    // onclick apply in bootstrap daterange picker
    $('#sosrange').on('apply.daterangepicker', (e, picker) => {
      this.updateRange({ fromDate: new Date(picker.startDate.format('MMMM D, YYYY')), toDate: new Date(picker.endDate.format('MMMM D, YYYY')) });
    });
  }

  // handler function that receives the updated date range object
  updateRange(range: any) {
    this.range = range;
    this.fullFilter(true);
  }

  //get sos data by date range filter
  fullFilter(dateChange?) {
    const startDate = moment(this.range.fromDate).format('YYYY-MM-DD');
    const endDate = moment(this.range.toDate).format('YYYY-MM-DD');
     this.getSIFgraphReport(startDate, endDate,true)
    }
}
