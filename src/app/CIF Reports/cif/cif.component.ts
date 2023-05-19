import { Component, ElementRef, OnInit, ViewChild,AfterViewInit  } from '@angular/core';
import { Chart } from 'chart.js';
import { SifService } from 'src/app/_services/sif.service';
import { CustomerService } from 'src/app/_services/customer.service';
import { IncidentsService } from 'src/app/_services/incidents.service';
import * as moment from 'moment';
import { NgxDrpOptions, PresetItem, Range } from 'ngx-mat-daterange-picker';
declare var $: any;

@Component({
  selector: 'app-cif',
  templateUrl: './cif.component.html',
  styleUrls: ['./cif.component.css']
})
export class CIFComponent implements OnInit {

  companyColor = null;
  accentColor = null;
  cifGraph: any
  incidentType: any
  cifCountBarChart;
  incidentWhyItBarChart;
  incidentWhatItBarChart;
  whyValuesData: any;

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
    this.getCIFgraphReport(startDate1, endDate1, false)
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

  getCIFgraphReport(start,end, check) {
    // For get Incident Type data
    this.IncidentsService.getIncidentTypes().subscribe(r => {
      if (r.data) {
        for (var i = 0; i < r.data.length; i++) {
          if (r.data[i].name == "Hazard / Near Miss") {
            this.incidentType = r.data[i].id
            this.SifService.getSIFGraph(this.incidentType, start, end).subscribe(r => {
              const keys = Object.keys(r.data.what)
              const values = Object.values(r.data.what)
              const whyValues = Object.values(r.data.why)
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
              const whatBarGraph = {
                 'labels': ['What'],
                'datasets': whatdatasets
              };

              let whySubsetChart = [];
              for (var i = 0; i < this.whyValuesData.length; i++){
                whySubsetChart.push({
                  'labels':this.twoWords(Object.keys(whyValues[i])),
                  'datasets': [{
                      label:this.whyValuesData[i],
                    'data':  Object.values(whyValues[i]),
                    'fill': false,
                    'backgroundColor': bg_color
                  }]
                });
              }

              this.createIncidentCIFWhyWorkingBarChart(whySubsetChart,check);
              this.createIncidentSIFWhatBarChart(whatBarGraph, check);
            })
          }
        }
      }
    })
  }

  //SIF bar chart for what
  createIncidentSIFWhatBarChart(cifGraph, check) {
    const htmlRef = this.elementRef.nativeElement.querySelector(`#cifData_what_it_bar_chart`);
    const data = cifGraph
    const config = {
      type: 'bar',
      data: data,
      options: {

        responsive: true,
        tooltips: {enabled: 'legend'},
        hover: {mode: 'legend'},
        legend: {
          display:true,
          position: 'top',
          align: 'start',
          labels: {
            boxWidth: 12
          }
        },
        title: {
          display: false,
          text: 'CIF What Bar Chart'
        },
        scales: {
          yAxes: [{ ticks: { beginAtZero: true } }]
        },
      }
    };
    if (cifGraph &&  htmlRef) {
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
      } else {
        this.incidentWhatItBarChart = new Chart(htmlRef, config);
      }
    }
  }
  //SIF bar chart for what
  createIncidentCIFWhyWorkingBarChart(cifGraph,check) {
    // const htmlRef = document.querySelectorAll('.why_bar');
    setTimeout(function (){
      const htmlRef =  document.querySelectorAll('.why_bar');
      for (var i = 0; i < htmlRef.length; i++) {
        const data = cifGraph[i]
        console.log(data)
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
              yAxes: [{
                ticks: {
                  stepSize: 1,
                  beginAtZero: true
                }
              }]
            },
          }
        };
        
        if (cifGraph &&  htmlRef[i]) {
          if(check == true) {
            this.incidentWhyItBarChart.config.data = data;
            this.incidentWhyItBarChart.update();
          } else {
            this.incidentWhyItBarChart = new Chart(htmlRef[i], config);
          }
        }
      }
    }, 2000)
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

  //get cif data by date range filter
  fullFilter(dateChange?) {
    const startDate = moment(this.range.fromDate).format('YYYY-MM-DD');
    const endDate = moment(this.range.toDate).format('YYYY-MM-DD');
    this.getCIFgraphReport(startDate, endDate, true)
  }
}

