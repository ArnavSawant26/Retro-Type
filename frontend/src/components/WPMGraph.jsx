import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const WPMGraph = ({ data }) => {
  if (!data || data.length < 2) return null;

  return (
    <div style={{ width: "100%", height: 160 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
          <XAxis
            dataKey="time"
            tick={{ fill: "#606078", fontSize: 11 }}
            axisLine={{ stroke: "#2a2a3a" }}
            tickLine={false}
            unit="s"
          />
          <YAxis
            tick={{ fill: "#606078", fontSize: 11 }}
            axisLine={{ stroke: "#2a2a3a" }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#1a1a26",
              border: "1px solid #2a2a3a",
              borderRadius: 8,
              fontSize: 12,
              color: "#e0e0f0",
            }}
            labelFormatter={(v) => `${v}s`}
          />
          <Line
            type="monotone"
            dataKey="wpm"
            stroke="#39ff14"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#39ff14", stroke: "#0a0a0f", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WPMGraph;
