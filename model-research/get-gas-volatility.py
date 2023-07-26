import pandas as pd
import matplotlib.pyplot as plt

data_volatility = pd.read_csv("./filtered_gas_data.csv")

data_volatility['Date(UTC)'] = pd.to_datetime(data_volatility['Date(UTC)'])

data_volatility['Daily Returns'] = data_volatility['Value(Gwei)'].pct_change()

data_volatility['Rolling Volatility'] = data_volatility['Daily Returns'].rolling(window=30).std()

data_volatility['15-day Rolling Volatility'] = data_volatility['Daily Returns'].rolling(window=15).std()

month_ticks = data_volatility['Date(UTC)'].dt.to_period("M").drop_duplicates().dt.start_time

plt.figure(figsize=(20, 10))
plt.plot(data_volatility["Date(UTC)"], data_volatility["Rolling Volatility"], color='purple', label="30-day Rolling Volatility")
plt.xticks(month_ticks, month_ticks.dt.strftime('%b %Y'), rotation=45)
plt.xlabel("Month")
plt.ylabel("30-day Rolling Volatility")
plt.title("30-day Rolling Volatility of ETH Gas Price")
plt.legend()
plt.tight_layout()
plt.grid(True, which="both", linestyle="--", linewidth=0.5)
plt.show()

plt.figure(figsize=(20, 10))
plt.plot(data_volatility["Date(UTC)"], data_volatility["15-day Rolling Volatility"], color='orange', label="15-day Rolling Volatility")
plt.xticks(month_ticks, month_ticks.dt.strftime('%b %Y'), rotation=45)
plt.xlabel("Month")
plt.ylabel("15-day Rolling Volatility")
plt.title("15-day Rolling Volatility of ETH Gas Price")
plt.legend()
plt.tight_layout()
plt.grid(True, which="both", linestyle="--", linewidth=0.5)
plt.show()
