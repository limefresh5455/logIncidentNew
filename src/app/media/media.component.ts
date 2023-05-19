import { Component, OnInit } from '@angular/core';
import {MediaService} from '../_services/media.service';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-media',
  templateUrl: './media.component.html',
  styleUrls: ['./media.component.css']
})
export class MediaComponent implements OnInit {

  constructor(private mediaService: MediaService, private route: ActivatedRoute) { }

  ngOnInit() {
    const uuid = this.route.snapshot.paramMap.get('uuid');
    this.mediaService.getMedia(uuid).subscribe(r => {
      const url = window.URL.createObjectURL(r);
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.setAttribute('style', 'display: none');
      a.href = url;
      a.download = uuid;
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    });
  }

}
