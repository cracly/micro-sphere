import json
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import plotly.express as px
from datetime import datetime
import numpy as np

# Load the weather data
with open('./data/processed_geosphere.json', 'r') as f:
    weather_data = json.load(f)

# Convert to DataFrame for easier manipulation
df = pd.DataFrame(weather_data['forecast_data'])
df['time'] = pd.to_datetime(df['time'])

# Convert precipitation from kg/m² to mm (1 kg/m² = 1 mm)
df['precipitation_mm'] = df['precipitation']

# Convert wind speed from m/s to km/h for better readability
df['wind_speed_kmh'] = df['wind_speed'] * 3.6
df['wind_gust_kmh'] = df['wind_gust'] * 3.6

# Create subplots with secondary y-axis for different parameters
fig = make_subplots(
    rows=3, cols=1,
    subplot_titles=('Temperature & Dew Point', 'Precipitation & Humidity Risk', 'Wind Conditions'),
    vertical_spacing=0.12,
    specs=[[{"secondary_y": False}],
           [{"secondary_y": True}],
           [{"secondary_y": True}]]
)

# Color palette - modern and appealing
colors = {
    'temperature': '#FF6B6B',
    'dew_point': '#4ECDC4',
    'precipitation': '#45B7D1',
    'wind_speed': '#96CEB4',
    'wind_gust': '#FFEAA7',
    'humidity_risk': '#DDA0DD'
}

# 1. Temperature and Dew Point (Row 1)
fig.add_trace(
    go.Scatter(
        x=df['time'],
        y=df['temperature'],
        mode='lines+markers',
        name='Temperature',
        line=dict(color=colors['temperature'], width=3),
        marker=dict(size=8, symbol='circle'),
        hovertemplate='<b>Temperature</b><br>%{y:.1f}°C<br>%{x}<extra></extra>'
    ),
    row=1, col=1
)

fig.add_trace(
    go.Scatter(
        x=df['time'],
        y=df['dew_point'],
        mode='lines+markers',
        name='Dew Point',
        line=dict(color=colors['dew_point'], width=2, dash='dot'),
        marker=dict(size=6, symbol='diamond'),
        hovertemplate='<b>Dew Point</b><br>%{y:.1f}°C<br>%{x}<extra></extra>'
    ),
    row=1, col=1
)

# Add temperature comfort zone
fig.add_hrect(
    y0=df['temperature'].min() - 0.5, y1=df['temperature'].max() + 0.5,
    fillcolor="rgba(255, 107, 107, 0.1)", line_width=0,
    row=1, col=1
)

# 2. Precipitation with emphasis (Row 2)
# Convert precipitation to percentage of maximum for visual emphasis
precip_max = max(df['precipitation_mm'].max(), 0.1)  # Avoid division by zero
df['precip_scaled'] = (df['precipitation_mm'] / precip_max) * 100

fig.add_trace(
    go.Bar(
        x=df['time'],
        y=df['precipitation_mm'],
        name='Precipitation',
        marker_color=colors['precipitation'],
        opacity=0.8,
        hovertemplate='<b>Precipitation</b><br>%{y:.2f} mm<br>%{x}<extra></extra>'
    ),
    row=2, col=1
)

# Add humidity risk indicator (temperature - dew point difference)
df['humidity_comfort'] = df['temperature'] - df['dew_point']
fig.add_trace(
    go.Scatter(
        x=df['time'],
        y=df['humidity_comfort'],
        mode='lines+markers',
        name='Humidity Comfort',
        line=dict(color=colors['humidity_risk'], width=2),
        marker=dict(size=6),
        yaxis='y2',
        hovertemplate='<b>Humidity Comfort</b><br>%{y:.1f}°C difference<br>%{x}<extra></extra>'
    ),
    row=2, col=1, secondary_y=True
)

# 3. Wind conditions (Row 3)
fig.add_trace(
    go.Scatter(
        x=df['time'],
        y=df['wind_speed_kmh'],
        mode='lines+markers',
        name='Wind Speed',
        line=dict(color=colors['wind_speed'], width=2),
        marker=dict(size=6),
        hovertemplate='<b>Wind Speed</b><br>%{y:.1f} km/h<br>%{x}<extra></extra>'
    ),
    row=3, col=1
)

fig.add_trace(
    go.Scatter(
        x=df['time'],
        y=df['wind_gust_kmh'],
        mode='lines+markers',
        name='Wind Gusts',
        line=dict(color=colors['wind_gust'], width=2, dash='dash'),
        marker=dict(size=6, symbol='triangle-up'),
        hovertemplate='<b>Wind Gusts</b><br>%{y:.1f} km/h<br>%{x}<extra></extra>'
    ),
    row=3, col=1
)

# Add wind direction as secondary axis
fig.add_trace(
    go.Scatter(
        x=df['time'],
        y=df['wind_direction'],
        mode='markers',
        name='Wind Direction',
        marker=dict(
            size=8,
            color=df['wind_direction'],
            colorscale='HSV',
            symbol='arrow-up',
            line=dict(width=2, color='black')
        ),
        yaxis='y4',
        hovertemplate='<b>Wind Direction</b><br>%{y:.0f}°<br>%{x}<extra></extra>'
    ),
    row=3, col=1, secondary_y=True
)

# Update layout with modern styling
fig.update_layout(
    title={
        'text': f'<b>Weather Forecast - {weather_data["location"]}</b><br><sup>3-hour nowcast with 15-minute resolution | Data: {weather_data["source"]}</sup>',
        'x': 0.5,
        'xanchor': 'center',
        'font': {'size': 20, 'color': '#2C3E50'}
    },
    height=900,
    showlegend=True,
    legend=dict(
        orientation="h",
        yanchor="bottom",
        y=1.02,
        xanchor="right",
        x=1,
        bgcolor="rgba(255,255,255,0.8)",
        bordercolor="rgba(0,0,0,0.2)",
        borderwidth=1
    ),
    plot_bgcolor='rgba(248,249,250,0.8)',
    paper_bgcolor='white',
    font=dict(family="Arial, sans-serif", size=12, color="#2C3E50"),
    margin=dict(l=80, r=80, t=100, b=80)
)

# Update x-axes
for i in range(1, 4):
    fig.update_xaxes(
        title_text="Time" if i == 3 else "",
        showgrid=True,
        gridwidth=1,
        gridcolor='rgba(128,128,128,0.2)',
        tickformat='%H:%M',
        row=i, col=1
    )

# Update y-axes with proper scaling and labels
fig.update_yaxes(
    title_text="Temperature (°C)",
    showgrid=True,
    gridwidth=1,
    gridcolor='rgba(128,128,128,0.2)',
    range=[df['dew_point'].min() - 1, df['temperature'].max() + 1],
    row=1, col=1
)

fig.update_yaxes(
    title_text="Precipitation (mm)",
    showgrid=True,
    gridwidth=1,
    gridcolor='rgba(128,128,128,0.2)',
    range=[0, max(df['precipitation_mm'].max() * 1.2, 0.02)],
    row=2, col=1
)

fig.update_yaxes(
    title_text="Comfort Index (°C)",
    showgrid=False,
    range=[0, 6],
    row=2, col=1, secondary_y=True
)

fig.update_yaxes(
    title_text="Wind Speed (km/h)",
    showgrid=True,
    gridwidth=1,
    gridcolor='rgba(128,128,128,0.2)',
    range=[0, df['wind_gust_kmh'].max() * 1.1],
    row=3, col=1
)

fig.update_yaxes(
    title_text="Direction (°)",
    showgrid=False,
    range=[0, 360],
    tickvals=[0, 90, 180, 270, 360],
    ticktext=['N', 'E', 'S', 'W', 'N'],
    row=3, col=1, secondary_y=True
)

# Add annotations for key insights
if df['precipitation_mm'].max() > 0:
    fig.add_annotation(
        x=df.loc[df['precipitation_mm'].idxmax(), 'time'],
        y=df['precipitation_mm'].max(),
        text=f"Peak Rain: {df['precipitation_mm'].max():.2f}mm",
        showarrow=True,
        arrowhead=2,
        arrowcolor=colors['precipitation'],
        bgcolor="rgba(255,255,255,0.8)",
        bordercolor=colors['precipitation'],
        borderwidth=2,
        row=2, col=1
    )

# Add temperature trend annotation
temp_trend = "Rising" if df['temperature'].iloc[-1] > df['temperature'].iloc[0] else "Falling"
fig.add_annotation(
    x=df['time'].iloc[-1],
    y=df['temperature'].iloc[-1],
    text=f"Temp Trend: {temp_trend}",
    showarrow=True,
    arrowhead=2,
    arrowcolor=colors['temperature'],
    bgcolor="rgba(255,255,255,0.8)",
    bordercolor=colors['temperature'],
    borderwidth=2,
    row=1, col=1
)

# Show the plot
fig.show()

# Additional summary statistics
print("\n" + "="*50)
print(f"WEATHER SUMMARY - {weather_data['location']}")
print("="*50)
print(f"Temperature Range: {df['temperature'].min():.1f}°C to {df['temperature'].max():.1f}°C")
print(f"Total Precipitation: {df['precipitation_mm'].sum():.2f} mm")
print(f"Average Wind Speed: {df['wind_speed_kmh'].mean():.1f} km/h")
print(f"Maximum Wind Gust: {df['wind_gust_kmh'].max():.1f} km/h")
print(f"Humidity Risk Level: {'Low' if df['humidity_comfort'].mean() > 2 else 'Moderate'}")

# Export option
fig.write_html("weather_forecast_visualization.html")
print(f"\nVisualization saved as 'weather_forecast_visualization.html'")