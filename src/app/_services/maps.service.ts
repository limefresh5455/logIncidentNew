import {Injectable} from '@angular/core';
import {Observable, Observer} from 'rxjs';
import {HttpClient, HttpHeaders} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class MapsService {

  constructor(private httpClient: HttpClient) {
  }

  getGeoLocation(lat: number, lng: number): Observable<google.maps.GeocoderResult[]> {
    const geocoder = new google.maps.Geocoder();
    const latlng = new google.maps.LatLng(lat, lng);
    return new Observable((observer: Observer<google.maps.GeocoderResult[]>) => {
      // geocoder.geocode({'latLng': latlng}, (
      geocoder.geocode({'location': latlng}, (
        (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
          if (status === google.maps.GeocoderStatus.OK) {
            observer.next(results);
            observer.complete();
          } else {
            console.log('Geocoding service failed due to: ' + status);
            observer.error(status);
          }
        }
      ));
    });
  }

  getWhats3words(lat: number, lng: number): Observable<any> {
    const url = `https://api.what3words.com/v3/convert-to-3wa?coordinates=${lat},${lng}&key=HC15SNW9`;
    return this.httpClient.get<any>(url);
  }

  getlocWhats3words(words: string): Observable<any> {
    const url = `https://api.what3words.com/v3/convert-to-coordinates?words=${words}&key=HC15SNW9`;
    return this.httpClient.get<any>(url);
  }



}
