'use client';

import { TeamMember } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { motion } from 'framer-motion';

interface TeamTableProps {
  data: TeamMember[];
}

const riskColor = (score: number) => {
  if (score >= 60) return 'text-red-400';
  if (score >= 35) return 'text-yellow-400';
  return 'text-emerald-400';
};

export default function TeamTable({ data }: TeamTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Team Performance
            </h3>
          </div>
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    Member
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground text-right">
                    Reviews
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground text-right">
                    Issues Found
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground text-right">
                    Avg Risk
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((member, idx) => (
                  <TableRow
                    key={member.login}
                    className="border-border/30 hover:bg-muted/30 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-border">
                          <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs">
                            {member.login.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{member.login}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm">{member.reviewsReceived}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className="text-xs bg-orange-500/10 text-orange-400 border-orange-500/30"
                      >
                        {member.issuesFound}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm font-bold ${riskColor(member.avgRiskScore)}`}>
                        {member.avgRiskScore}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
