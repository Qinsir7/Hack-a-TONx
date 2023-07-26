import pandas as pd
import matplotlib.pyplot as plt

data_processed = pd.read_csv("./filtered_gas_data.csv")

data_processed['Date(UTC)'] = pd.to_datetime(data_processed['Date(UTC)'])

plt.figure(figsize=(20, 10))
plt.bar(data_processed["Date(UTC)"], data_processed["Value(Gwei)"], color='lightblue')

month_ticks = data_processed['Date(UTC)'].dt.to_period("M").drop_duplicates().dt.start_time
plt.xticks(month_ticks, month_ticks.dt.strftime('%b %Y'), rotation=45)

plt.xlabel("Month")
plt.ylabel("Value (Gwei)")
plt.title("Daily ETH Gas Price Over Time")
plt.tight_layout()
plt.grid(True, which="both", linestyle="--", linewidth=0.5, axis='y')
plt.show()
