"""A series of functions to use PyEphem for lake-afton-api."""

import sys
import json
import datetime
import ephem
import pytz
import dateutil.parser
import celestial_objects

#default_lat=37.62218579135644
#default_lon=-97.62695789337158
#default_elev=421
time_format='%Y-%m-%dT%H:%M:%S%z'
default_tz='America/Chicago'

object_dict=celestial_objects.get_objects([
    (r'C:\Users\c41663\Documents\programming\lake-afton-api\routes\messier.txt',None),
    (r'C:\Users\c41663\Documents\programming\lake-afton-api\routes\caldwell.txt',None),
    (r'C:\Users\c41663\Documents\programming\lake-afton-api\routes\stars.txt','star'),
    ('https://minorplanetcenter.net/iau/Ephemerides/Bright/2018/Soft03Bright.txt','solar_system'),
    #('https://minorplanetcenter.net/iau/Ephemerides/Comets/Soft03Cmt.txt','solar_system'),
    #('http://celestrak.com/NORAD/elements/visual.txt','satellite')
])

def read_in():
    lines=sys.stdin.readlines()
    return json.loads(lines[0])

def get_location(lat,
                 lon,
                 elev=None,
                 date=None,
                 horizon=None):
    obs=ephem.Observer()
    obs.lat,obs.lon=lat,lon
    if elev:
        obs.elev=elev
    if date:
        obs.date=date
    if horizon:
        obs.horizon=horizon
    return obs

def format_angle(angle,dms=False):
    a=angle.znorm
    a*=180/ephem.pi
    if dms:
        d=int(a)
        a-=int(a)
        a*=60
        m=int(a)
        a-=int(a)
        a*=60
        s=a
        return d,m,s
    return a

def format_ra(angle,hms=False):
    a=angle.norm
    a*=12/ephem.pi
    if hms:
        h=int(a)
        a-=int(a)
        a*=60
        m=int(a)
        a-=int(a)
        a*=60
        s=a
        return h,m,s
    return a

def get_data(object_list,
             location=None,
             ):
    body_data=[]
    for o,body_type in object_list:
        if location:
            o.compute(location)
        else:
            o.compute()
        data={
              'name':o.name,
              'ra':format_ra(o.ra,True),
              'dec':format_angle(o.dec),
              'size':o.size,
              'mag':o.mag,
              'elong':o.elong,
             }
        if location:
            data['alt']:format_angle(o.alt)
            data['az']:format_angle(o.az)
        if body_type=='star':
            data['spectral_type']=o._spect
        if body_type=='solar_system':
            data['earth_dist']={'au':o.earth_distance,'km':o.earth_distance*149597870.700,'mi':o.earth_distance*149597870700/1604.344}
            data['sun_dist']={'au':o.sun_distance,'km':o.sun_distance*149597870.700,'mi':o.sun_distance*149597870700/1604.344}
            data['phase']=o.phase
            if o.name=='Moon':
                data['illuminated_surface']=o.moon_phase*100
                data['phase_name']=get_phase_name(o,location)
                data['next_new_moon']=(ephem.next_new_moon(location.date if location else ephem.now())).datetime()
                data['next_first_quarter']=(ephem.next_first_quarter_moon(location.date if location else ephem.now())).datetime()
                data['next_full_moon']=(ephem.next_full_moon(location.date if location else ephem.now())).datetime()
                data['next_last_quarter']=(ephem.next_last_quarter_moon(location.date if location else ephem.now())).datetime()
            if o.name=='Sun':
                data['next_solstice']=(ephem.next_solstice(location.date if location else ephem.now())).datetime()
                data['next_equinox']=(ephem.next_equinox(location.date if location else ephem.now())).datetime()
            data['constellation']=ephem.constellation(o)
        elif body_type=='satellite':
            data['elev']={'m':o.elevation,'mi':o.elevation/1604.344}
            if location:
                data['range']={'m':o.range,'mi':o.range/1604.344}
                data['range_velocity']=o.range_velocity
                rise_time,rise_az,max_alt_time,max_alt,set_time,set_az=location.next_pass(o)
                data['next_pass']={
                    'rise_time':rise_time.datetime(),
                    'rise_az':format_angle(rise_az),
                    'max_altitude_time':max_alt_time.datetime(),
                    'max_altitude':format_angle(max_alt),
                    'set_time':set_time.datetime(),
                    'set_az':format_angle(set_az),
                }
            data['eclipsed']=o.eclipsed
        elif body_type=='planetary_moon':
            data['visible']=o.earth_visible
            data['pos']=o.x,o.y,o.z
        #computed last, since it changes time, body position
        if body_type not in ['satellite','planetary_moon'] and location:# and not o.neverup and not o.circumpolar:
            data['rise_time']=(location.next_rising(o,start=location.previous_antitransit(o))).datetime()
            data['rise_az']=format_angle(o.az)
            data['transit_time']=(location.next_transit(o,start=location.previous_antitransit(o))).datetime()
            data['transit_alt']=format_angle(o.alt)
            data['set_time']=(location.next_setting(o,start=location.previous_antitransit(o))).datetime()
            data['set_az']=format_angle(o.az)
        body_data.append(data)
    return body_data

def whats_up(start,end,location,magnitude=6.):
    body_list=[]
    start,end=ephem.Date(start),ephem.Date(end)
    for o,body_type in filter(lambda x:x[1]!='planetary_moon',object_dict.values()):
        o.compute(location)
        if body_type!='satellite' and not o.circumpolar and not o.neverup:
            rising=location.next_rising(o)
            setting=location.next_setting(o)
        elif body_type=='satellite':
            rising,rise_az,max_alt_time,max_alt,set_time,setting=location.next_pass(o)
        if (o.circumpolar or rising<end or setting>start) and o.mag<magnitude:
            body_list.append(o.name)
    return body_list

def get_phase_name(moon,location=None,wiggle_room=1.5):
    if location:
        date=location.date
    else:
        date=ephem.now()
    if abs(ephem.next_first_quarter_moon(date)-date)<wiggle_room or abs(ephem.previous_first_quarter_moon(date)-date)<wiggle_room:
        return 'first quarter moon'
    elif abs(ephem.next_full_moon(date)-date)<wiggle_room or abs(ephem.previous_full_moon(date)-date)<wiggle_room:
        return 'full moon'
    elif abs(ephem.next_last_quarter_moon(date)-date)<wiggle_room or abs(ephem.previous_last_quarter_moon(date)-date)<wiggle_room:
        return 'last quarter moon'
    elif abs(ephem.next_new_moon(date)-date)<wiggle_room or abs(ephem.previous_new_moon(date)-date)<wiggle_room:
        return 'new moon'
    elif ephem.next_first_quarter_moon(date)-ephem.previous_new_moon(date)<29:
        return 'waxing crescent'
    elif ephem.next_full_moon(date)-ephem.previous_first_quarter_moon(date)<29:
        return 'waxing gibbous'
    elif ephem.next_last_quarter_moon(date)-ephem.previous_full_moon(date)<29:
        return 'waning gibbous'
    elif ephem.next_new_moon(date)-ephem.previous_last_quarter_moon(date)<29:
        return 'waning crescent'

class Encoder(json.JSONEncoder):
    global tz
    def default(self,obj):
        if isinstance(obj,datetime.datetime):
            if obj.tzinfo is None or obj.tzinfo.utcoffset(obj) is None:
                obj=pytz.utc.localize(obj)
            if tz is not None:
                return obj.astimezone(pytz.timezone(tz)).strftime(time_format)
            return obj.strftime(time_format)
        return json.JSONEncoder.default(self,obj)

def main():
    global tz
    data=read_in()
    lat=str(data['lat']) if 'lat' in data.keys() else None
    lon=str(data['lon']) if 'lon' in data.keys() else None
    elev=data['elev'] if 'elev' in data.keys() else None
    horizon=data['horizon'] if 'horizon' in data.keys() else None
    date=data['date'] if 'date' in data.keys() else datetime.datetime.now()
    tz=data['tz'] if 'tz' in data.keys() else default_tz
    if isinstance(date,str):
        date=dateutil.parser.parse(date)
        date=pytz.timezone(tz).localize(date)
        date=date.astimezone(pytz.utc)
    end=data['end'] if 'end' in data.keys() else None
    if isinstance(end,str):
        end=dateutil.parser.parse(end)
        end=pytz.timezone(tz).localize(end)
        end=end.astimezone(pytz.utc)
    min_magnitude=data['mag'] if 'mag' in data.keys() else 6
    if lat and lon:
        location=get_location(lat,lon,elev,date)
    else:
        location=None
    try:
        query_set=set(map(str.lower,data['body']))
        query_set=query_set.intersection(set(object_dict.keys()))
        query_list=list(map(lambda x:object_dict[x],query_set))
        info=get_data(query_list,location)
    except KeyError:
        if location:
            if not end:
                end=date
            info=whats_up(date,end,location,magnitude=min_magnitude)
        else:
            info='nothing'
    print(json.dumps(info,cls=Encoder))
    
if __name__=='__main__':
    main()
